import { computed, watch, onMounted } from 'vue';
import { productGetters } from '@plentymarkets/shop-api';

export interface LoyalistaMerchantTexts {
  heading?: string | null;
  registered?: string | null;
  unregistered?: string | null;
  extra_points?: string | null;
  points_label?: string | null;
}

export interface LoyalistaProductDataResponse {
  user_registered?: boolean;
  revenue_to_point?: number | string;
  point_to_value?: number | string;
  points_for_signup?: number | string;
  category_extra_points?: number | string;
  product_extra_points?: number | string;
  category_ids?: string;
  product_ids?: string;
  texts?: LoyalistaMerchantTexts;
}

export interface LoyalistaApiResponse {
  success: boolean;
  data?: LoyalistaProductDataResponse;
  message?: string;
}

/**
 * Replaces placeholder tokens in product text templates.
 *
 * Supported tokens:
 * - [points_for_product]      Base earning points for the product
 * - [number_of_points]        Base earning points for the product (synonym)
 * - [points_for_signup]       Bonus points for account registration
 * - [number_of_extra_points]  Extra points from product or category bonus
 * - [points_label]            Configured label for points (e.g. "Punkte" / "Points")
 */
export const replaceLoyalistaTokens = (
  template: string,
  replacements: {
    earningPoints?: number | string | null;
    pointsForSignup?: number | string | null;
    extraPoints?: number | string | null;
    pointsLabel?: string | null;
  },
  locale = 'de-DE',
): string => {
  let content = template;

  const earningFormatted =
    replacements.earningPoints !== undefined && replacements.earningPoints !== null
      ? typeof replacements.earningPoints === 'number'
        ? replacements.earningPoints.toLocaleString(locale)
        : String(replacements.earningPoints)
      : '';
  content = content.replace(/\[points_for_product\]/gi, earningFormatted);
  content = content.replace(/\[number_of_points\]/gi, earningFormatted);

  const signupFormatted =
    replacements.pointsForSignup !== undefined && replacements.pointsForSignup !== null
      ? typeof replacements.pointsForSignup === 'number'
        ? replacements.pointsForSignup.toLocaleString(locale)
        : String(replacements.pointsForSignup)
      : '';
  content = content.replace(/\[points_for_signup\]/gi, signupFormatted);

  if (replacements.extraPoints !== undefined && replacements.extraPoints !== null) {
    const extraFormatted =
      typeof replacements.extraPoints === 'number'
        ? replacements.extraPoints.toLocaleString(locale)
        : String(replacements.extraPoints);
    content = content.replace(/\[number_of_extra_points\]/gi, extraFormatted);
  }

  const label = replacements.pointsLabel || '';
  content = content.replace(/\[points_label\]/gi, label);

  return content;
};

/**
 * Composable for calculating and displaying loyalty points on product detail pages.
 *
 * Coordinates loyalty configuration fetching, computes base and extra points
 * for the active variation and price, and formats localized merchant texts.
 */
export const useLoyalistaProductPoints = () => {
  const { currentProduct } = useProducts();
  const { isAuthorized } = useCustomer();
  const { locale } = useI18n();

  const loading = useState<boolean>('loyalista-product-points-loading', () => false);
  const error = useState<string | null>('loyalista-product-points-error', () => null);
  const productData = useState<LoyalistaProductDataResponse | null>(
    'loyalista-product-data',
    () => null,
  );

  let fetchPromise: Promise<LoyalistaProductDataResponse | null> | null = null;

  /**
   * Fetches loyalty program configuration and merchant texts.
   * Supports both authenticated customers and guest visitors.
   *
   * @param force - If true, bypasses in-flight request deduplication and cached state
   */
  const fetchProductData = async (force = false): Promise<LoyalistaProductDataResponse | null> => {
    // Execute client-side only because REST endpoints require session context
    if (!import.meta.client) {
      return null;
    }

    if (productData.value && !force) {
      return productData.value;
    }

    if (fetchPromise && !force) {
      return fetchPromise;
    }

    loading.value = true;
    error.value = null;

    fetchPromise = (async () => {
      try {
        const response = await fetch('/rest/loyalista/widget/product-data/', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const result: LoyalistaApiResponse = await response.json();
        if (result && result.success && result.data) {
          productData.value = result.data;
          return result.data;
        } else {
          const msg = result?.message || 'Failed to load loyalty product data';
          error.value = msg;
          return null;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading loyalty product data';
        error.value = msg;
        return null;
      } finally {
        loading.value = false;
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  };

  /**
   * Current active variation ID.
   */
  const variationId = computed<number>(() => {
    if (!currentProduct.value || !Object.keys(currentProduct.value).length) {
      return 0;
    }
    return Number(productGetters.getVariationId(currentProduct.value)) || 0;
  });

  /**
   * Current active variation price (taking special offer into account if lower).
   */
  const price = computed<number>(() => {
    if (!currentProduct.value || !Object.keys(currentProduct.value).length) {
      return 0;
    }
    const specialOffer = productGetters.getSpecialOffer(currentProduct.value);
    const regularPrice = productGetters.getPrice(currentProduct.value) ?? 0;
    return specialOffer && specialOffer < regularPrice ? specialOffer : regularPrice;
  });

  /**
   * Current product's category IDs.
   */
  const categoryIds = computed<string[]>(() => {
    if (!currentProduct.value || !Object.keys(currentProduct.value).length) {
      return [];
    }
    return productGetters.getCategoryIds(currentProduct.value).map(String);
  });

  /**
   * Base earning points calculated from product price and conversion ratio.
   * Returns null if configuration is missing or invalid.
   */
  const earningPoints = computed<number | null>(() => {
    if (
      !productData.value ||
      productData.value.revenue_to_point === undefined ||
      productData.value.revenue_to_point === null ||
      productData.value.revenue_to_point === ''
    ) {
      return null;
    }

    const rev = parseFloat(String(productData.value.revenue_to_point));
    if (isNaN(rev) || rev <= 0) {
      return null;
    }

    if (price.value <= 0) {
      return 0;
    }

    return Math.round(price.value / rev);
  });

  /**
   * Extra points from product or category bonus configuration.
   */
  const extraPoints = computed<number>(() => {
    if (!productData.value) {
      return 0;
    }

    let extra = 0;

    // Product-specific extra points
    const productExtraAmount = parseFloat(String(productData.value.product_extra_points || 0)) || 0;
    const configProductIds = (productData.value.product_ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');

    if (productExtraAmount > 0 && configProductIds.length > 0 && variationId.value > 0) {
      if (configProductIds.includes(String(variationId.value))) {
        extra += productExtraAmount;
      }
    }

    // Category-specific extra points
    const categoryExtraAmount = parseFloat(String(productData.value.category_extra_points || 0)) || 0;
    const configCategoryIds = (productData.value.category_ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');

    if (categoryExtraAmount > 0 && configCategoryIds.length > 0 && categoryIds.value.length > 0) {
      const categoryMatches = categoryIds.value.some((catId) => configCategoryIds.includes(String(catId)));
      if (categoryMatches) {
        extra += categoryExtraAmount;
      }
    }

    return extra;
  });

  /**
   * Total points combining base earning points and applicable extra points.
   * Returns null if base points cannot be calculated.
   */
  const totalPoints = computed<number | null>(() => {
    if (earningPoints.value === null) {
      return null;
    }
    return earningPoints.value + extraPoints.value;
  });

  const isRegistered = computed<boolean>(() => Boolean(productData.value?.user_registered));

  /**
   * Localized merchant text with replaced tokens.
   * Selects registered or unregistered template based on customer status,
   * appending extra points notice when applicable.
   */
  const renderedText = computed<string | null>(() => {
    if (!productData.value || !productData.value.texts) {
      return null;
    }

    let template = isRegistered.value
      ? productData.value.texts.registered
      : productData.value.texts.unregistered;

    if (!template || !template.trim()) {
      return null;
    }

    if (extraPoints.value > 0 && productData.value.texts.extra_points) {
      template = `${template.trim()} ${productData.value.texts.extra_points.trim()}`;
    }

    const numberLocale = locale.value === 'de' ? 'de-DE' : 'en-US';

    return replaceLoyalistaTokens(
      template,
      {
        earningPoints: earningPoints.value ?? 0,
        pointsForSignup: productData.value.points_for_signup ?? '',
        extraPoints: extraPoints.value,
        pointsLabel: productData.value.texts.points_label ?? '',
      },
      numberLocale,
    );
  });

  if (import.meta.client) {
    watch(
      isAuthorized,
      () => {
        // Refresh loyalty status and texts on customer authorization change
        fetchProductData(true);
      },
    );

    onMounted(() => {
      if (!productData.value && !loading.value) {
        fetchProductData();
      }
    });
  }

  return {
    currentProduct,
    variationId,
    price,
    categoryIds,
    loading,
    error,
    productData,
    fetchProductData,
    earningPoints,
    extraPoints,
    totalPoints,
    isRegistered,
    isAuthorized,
    renderedText,
  };
};
