import { computed, watch, onMounted } from 'vue';
import { productGetters } from '@plentymarkets/shop-api';

export interface LoyalistaProductDataResponse {
  user_registered?: boolean;
  revenue_to_point?: number | string;
  point_to_value?: number | string;
  points_for_signup?: number | string;
  category_extra_points?: number | string;
  product_extra_points?: number | string;
  category_ids?: string;
  product_ids?: string;
}

export interface LoyalistaApiResponse {
  success: boolean;
  data?: LoyalistaProductDataResponse;
  message?: string;
}

/**
 * Composable for managing Loyalista product points on the product detail page.
 *
 * Responsibilities:
 * - Read current product, variation ID, and price from official PlentyONE composables
 * - Fetch loyalty program configuration from existing PlentyONE plugin endpoint
 * - Calculate earning points based on active price and revenue_to_point ratio
 * - Calculate extra points based on category and variation matching
 * - Provide reactive state (loading, error, total points) without silent fallbacks
 */
export const useLoyalistaProductPoints = () => {
  const { currentProduct } = useProducts();
  const { isAuthorized } = useCustomer();

  const loading = useState<boolean>('loyalista-product-points-loading', () => false);
  const error = useState<string | null>('loyalista-product-points-error', () => null);
  const productData = useState<LoyalistaProductDataResponse | null>(
    'loyalista-product-data',
    () => null,
  );

  let fetchPromise: Promise<LoyalistaProductDataResponse | null> | null = null;

  /**
   * Fetch loyalty program configuration from the existing PlentyONE plugin endpoint.
   * Cached in Nuxt state to avoid duplicate requests during variation changes.
   */
  const fetchProductData = async (force = false): Promise<LoyalistaProductDataResponse | null> => {
    // Only execute on client because /rest/ is handled by the PlentyONE PHP backend
    if (!import.meta.client) {
      return null;
    }

    // Do not fetch customer-specific loyalty data if customer is not logged in
    if (!isAuthorized.value) {
      productData.value = null;
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
   * Base earning points: Math.round(price / revenue_to_point).
   * Returns null if revenue_to_point is missing or invalid (no silent default).
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

    // 1. Product extra points
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

    // 2. Category extra points
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
   * Total points: base earning points + extra points.
   * Null if base points cannot be calculated (e.g. missing backend configuration).
   */
  const totalPoints = computed<number | null>(() => {
    if (earningPoints.value === null) {
      return null;
    }
    return earningPoints.value + extraPoints.value;
  });

  const isRegistered = computed<boolean>(() => Boolean(productData.value?.user_registered));

  if (import.meta.client) {
    watch(
      isAuthorized,
      (authorized) => {
        if (authorized) {
          fetchProductData(true);
        } else {
          productData.value = null;
        }
      },
    );

    onMounted(() => {
      if (isAuthorized.value && !productData.value && !loading.value) {
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
  };
};
