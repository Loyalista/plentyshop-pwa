import { computed, watch, onMounted, toRefs } from 'vue';
import { cartGetters } from '@plentymarkets/shop-api';
import type {
  LoyalistaCheckoutData,
  LoyalistaCheckoutDataResponse,
  LoyalistaBasketTotalResponse,
  LoyalistaRedeemResponse,
  LoyalistaRegisterResponse,
} from '../../types/checkout';

/**
 * Replaces placeholder tokens in checkout text templates.
 *
 * Supported tokens:
 * - [account_balance]                  Current available point balance (or max redeemable points)
 * - [value_of_account_balance]         Monetary value of redeemable points
 * - [discount_amount]                  Discount amount formatted as currency
 * - [number_of_points_shopping_cart]   Points to be earned from current shopping cart
 * - [points_for_order]                 Points to be earned from current shopping cart (synonym)
 * - [points_for_signup]                Bonus points granted upon loyalty registration
 * - [points_label]                     Configured label for points (e.g. "Punkte" / "Points")
 */
export const replaceLoyalistaCheckoutTokens = (
  template: string,
  replacements: {
    accountBalance?: number | string | null;
    valueOfAccountBalance?: number | string | null;
    discountAmount?: number | string | null;
    pointsForOrder?: number | string | null;
    pointsForSignup?: number | string | null;
    pointsLabel?: string | null;
  },
  locale = 'de-DE',
): string => {
  if (!template) {
    return '';
  }

  let content = template;

  const balanceFormatted =
    replacements.accountBalance !== undefined && replacements.accountBalance !== null
      ? typeof replacements.accountBalance === 'number'
        ? replacements.accountBalance.toLocaleString(locale)
        : String(replacements.accountBalance)
      : '0';
  content = content.replace(/\[account_balance\]/gi, balanceFormatted);

  const valueFormatted =
    replacements.valueOfAccountBalance !== undefined && replacements.valueOfAccountBalance !== null
      ? typeof replacements.valueOfAccountBalance === 'number'
        ? replacements.valueOfAccountBalance.toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : String(replacements.valueOfAccountBalance)
      : '0,00';
  content = content.replace(/\[value_of_account_balance\]/gi, valueFormatted);

  const discountFormatted =
    replacements.discountAmount !== undefined && replacements.discountAmount !== null
      ? typeof replacements.discountAmount === 'number'
        ? replacements.discountAmount.toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : String(replacements.discountAmount)
      : valueFormatted;
  content = content.replace(/\[discount_amount\]/gi, discountFormatted);

  const orderPointsFormatted =
    replacements.pointsForOrder !== undefined && replacements.pointsForOrder !== null
      ? typeof replacements.pointsForOrder === 'number'
        ? replacements.pointsForOrder.toLocaleString(locale)
        : String(replacements.pointsForOrder)
      : '0';
  content = content.replace(/\[number_of_points_shopping_cart\]/gi, orderPointsFormatted);
  content = content.replace(/\[points_for_order\]/gi, orderPointsFormatted);

  const signupFormatted =
    replacements.pointsForSignup !== undefined && replacements.pointsForSignup !== null
      ? typeof replacements.pointsForSignup === 'number'
        ? replacements.pointsForSignup.toLocaleString(locale)
        : String(replacements.pointsForSignup)
      : '0';
  content = content.replace(/\[points_for_signup\]/gi, signupFormatted);

  const label = replacements.pointsLabel || '';
  content = content.replace(/\[points_label\]/gi, label);

  return content;
};

/**
 * Calculates the maximum whole points redeemable for a given basket total and conversion rate.
 * Uses strict integer flooring without artificial epsilons to guarantee that the calculated
 * point amount is mathematically strictly less than or equal to the server-side validation
 * threshold in CheckoutController::createCoupon() ($basket_total / $one_point_to_value).
 */
export const calculateMaxPointsByBasket = (basketTotal: number, pointToValue: number): number => {
  const total = Number(basketTotal);
  const rate = Number(pointToValue);
  if (!Number.isFinite(total) || !Number.isFinite(rate) || total <= 0 || rate <= 0) {
    return 0;
  }
  return Math.floor(total / rate);
};

/**
 * Composable for managing loyalty points display, redemption, and customer enrollment in checkout.
 */
export const useLoyalistaCheckout = () => {
  const { data: cart } = useCart();
  const { isAuthorized } = useCustomer();
  const { locale, t } = useI18n();
  const { fetchSession } = useFetchSession();
  const { getBooleanSetting: getCheckoutEnabled } = useSiteSettings('loyalistaCheckoutEnabled');

  const isCheckoutEnabled = computed<boolean>(() => getCheckoutEnabled(true));

  const checkoutData = useState<LoyalistaCheckoutData | null>('loyalista-checkout-data', () => null);
  const basketData = useState<LoyalistaBasketTotalResponse | null>('loyalista-checkout-basket', () => null);
  const loading = useState<boolean>('loyalista-checkout-loading', () => false);
  const redeeming = useState<boolean>('loyalista-checkout-redeeming', () => false);
  const registering = useState<boolean>('loyalista-checkout-registering', () => false);
  const error = useState<string | null>('loyalista-checkout-error', () => null);
  const successMessage = useState<string | null>('loyalista-checkout-success', () => null);

  const selectedOption = useState<'skip' | 'all' | 'custom'>('loyalista-checkout-selected-option', () => 'skip');
  const customPoints = useState<number | null>('loyalista-checkout-custom-points', () => null);

  let fetchCheckoutPromise: Promise<LoyalistaCheckoutData | null> | null = null;
  let fetchBasketPromise: Promise<LoyalistaBasketTotalResponse | null> | null = null;

  const currentLocaleString = computed(() => (locale.value === 'de' ? 'de-DE' : 'en-US'));

  const isLoggedIn = computed<boolean>(() => Boolean(isAuthorized.value));

  const isLoyaltyMember = computed<boolean>(() => {
    return Boolean(isAuthorized.value && checkoutData.value?.user_registered);
  });

  const pointsLabel = computed<string>(() => {
    return checkoutData.value?.texts?.points_label || (locale.value === 'de' ? 'Punkte' : 'Points');
  });

  const accountBalance = computed<number>(() => {
    return Number(checkoutData.value?.total_redeemable_points) || 0;
  });

  const pointToValue = computed<number>(() => {
    const raw = String(checkoutData.value?.point_to_value || 0).replace(',', '.');
    const val = parseFloat(raw);
    return isNaN(val) ? 0 : val;
  });

  const revenueToPoint = computed<number>(() => {
    const raw = String(checkoutData.value?.revenue_to_point || 0).replace(',', '.');
    const val = parseFloat(raw);
    return isNaN(val) ? 0 : val;
  });

  const signupBonusPoints = computed<number>(() => {
    const raw = String(checkoutData.value?.signup_event_point || 0).replace(',', '.');
    const val = parseFloat(raw);
    return isNaN(val) ? 0 : Math.round(val);
  });

  const partialRedemptionEnabled = computed<boolean>(() => {
    return Boolean(checkoutData.value?.partial_redemption_enabled);
  });

  const basketTotal = computed<number>(() => {
    if (basketData.value && typeof basketData.value.basket_total === 'number') {
      return basketData.value.basket_total;
    }
    return Number(cart.value?.basketAmount) || 0;
  });

  const cartEarningPoints = computed<string>(() => {
    if (basketData.value?.total_cart_points !== undefined && basketData.value?.total_cart_points !== null) {
      return String(basketData.value.total_cart_points);
    }
    if (revenueToPoint.value > 0 && basketTotal.value > 0) {
      const pts = Math.round(basketTotal.value / revenueToPoint.value);
      return pts.toLocaleString(currentLocaleString.value);
    }
    return '0';
  });

  const hasActiveCoupon = computed<boolean>(() => {
    const code = cartGetters.getCouponCode(cart.value);
    if (typeof code === 'string' && code.trim().length > 0) {
      return true;
    }
    const discount = cartGetters.getCouponDiscount(cart.value);
    if (typeof discount === 'number' && discount !== 0) {
      return true;
    }
    return false;
  });

  const maxPointsByBasket = computed<number>(() => {
    return calculateMaxPointsByBasket(basketTotal.value, pointToValue.value);
  });

  const maxRedeemablePoints = computed<number>(() => {
    return Math.max(0, Math.min(accountBalance.value, maxPointsByBasket.value));
  });

  const maxDiscountValue = computed<number>(() => {
    return maxRedeemablePoints.value * pointToValue.value;
  });

  const renderedRegisteredText = computed<string>(() => {
    const template = checkoutData.value?.texts?.registered_user || '';
    return replaceLoyalistaCheckoutTokens(
      template,
      {
        accountBalance: accountBalance.value,
        pointsForOrder: cartEarningPoints.value,
        pointsLabel: pointsLabel.value,
      },
      currentLocaleString.value,
    );
  });

  const renderedFullRedeemText = computed<string>(() => {
    const template = checkoutData.value?.texts?.full_redeem || '';
    return replaceLoyalistaCheckoutTokens(
      template,
      {
        accountBalance: maxRedeemablePoints.value,
        valueOfAccountBalance: maxDiscountValue.value,
        discountAmount: maxDiscountValue.value,
        pointsLabel: pointsLabel.value,
      },
      currentLocaleString.value,
    );
  });

  const renderedPartialRedeemText = computed<string>(() => {
    const template = checkoutData.value?.texts?.partial_redeem || '';
    return replaceLoyalistaCheckoutTokens(
      template,
      {
        pointsLabel: pointsLabel.value,
      },
      currentLocaleString.value,
    );
  });

  const renderedUnregisteredText = computed<string>(() => {
    const template = checkoutData.value?.texts?.unregistered_user || '';
    return replaceLoyalistaCheckoutTokens(
      template,
      {
        pointsForSignup: signupBonusPoints.value,
        pointsForOrder: cartEarningPoints.value,
        pointsLabel: pointsLabel.value,
      },
      currentLocaleString.value,
    );
  });

  const renderedLoginRequiredText = computed<string>(() => {
    const template = checkoutData.value?.texts?.login_required || '';
    return replaceLoyalistaCheckoutTokens(
      template,
      {
        pointsForOrder: cartEarningPoints.value,
        pointsLabel: pointsLabel.value,
      },
      currentLocaleString.value,
    );
  });

  const renderedCouponAppliedText = computed<string>(() => {
    const template = checkoutData.value?.texts?.coupon_already_applied || '';
    if (!template) {
      return '';
    }
    return replaceLoyalistaCheckoutTokens(
      template,
      {
        accountBalance: accountBalance.value,
        pointsForOrder: cartEarningPoints.value,
        pointsLabel: pointsLabel.value,
      },
      currentLocaleString.value,
    );
  });

  const renderedNoRedeemText = computed<string>(() => {
    const template = checkoutData.value?.texts?.no_redeem || '';
    if (!template) {
      return '';
    }
    return replaceLoyalistaCheckoutTokens(
      template,
      {
        accountBalance: accountBalance.value,
        pointsForOrder: cartEarningPoints.value,
        pointsLabel: pointsLabel.value,
      },
      currentLocaleString.value,
    );
  });

  const fetchCheckoutData = async (): Promise<LoyalistaCheckoutData | null> => {
    if (!import.meta.client || !isCheckoutEnabled.value) {
      return null;
    }

    if (fetchCheckoutPromise) {
      return fetchCheckoutPromise;
    }

    loading.value = true;
    error.value = null;

    fetchCheckoutPromise = (async () => {
      try {
        const response = await fetch('/rest/loyalista/widget/checkout-data/', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const result: LoyalistaCheckoutDataResponse = await response.json();
        if (result && result.success && result.data) {
          checkoutData.value = result.data;
          return result.data;
        } else {
          const msg = result?.message || t('loyalista.checkout.errorLoadData');
          error.value = msg;
          return null;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t('loyalista.checkout.errorLoadData');
        error.value = msg;
        return null;
      } finally {
        loading.value = false;
        fetchCheckoutPromise = null;
      }
    })();

    return fetchCheckoutPromise;
  };

  const fetchBasketTotal = async (): Promise<LoyalistaBasketTotalResponse | null> => {
    if (!import.meta.client || !isCheckoutEnabled.value) {
      return null;
    }

    if (fetchBasketPromise) {
      return fetchBasketPromise;
    }

    fetchBasketPromise = (async () => {
      try {
        const response = await fetch('/rest/loyalista/basket/total/', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          return null;
        }

        const result: LoyalistaBasketTotalResponse = await response.json();
        if (result && result.status === 'OK') {
          basketData.value = result;
          return result;
        }
        return null;
      } catch {
        return null;
      } finally {
        fetchBasketPromise = null;
      }
    })();

    return fetchBasketPromise;
  };

  const redeemPoints = async (pointsToRedeem: number): Promise<boolean> => {
    if (!import.meta.client) {
      return false;
    }

    if (redeeming.value) {
      return false;
    }

    if (hasActiveCoupon.value) {
      error.value = checkoutData.value?.texts?.coupon_already_applied || t('loyalista.checkout.couponAlreadyActive');
      return false;
    }

    if (!Number.isInteger(pointsToRedeem) || pointsToRedeem <= 0) {
      const template = checkoutData.value?.texts?.errorMinPoints;
      error.value = template
        ? template.replace(/\{label\}/g, pointsLabel.value)
        : t('loyalista.checkout.invalidPointsAmount');
      return false;
    }

    if (pointsToRedeem > maxRedeemablePoints.value) {
      const template = checkoutData.value?.texts?.errorMaxPoints;
      error.value = template
        ? template
            .replace(/\{max_points\}/g, maxRedeemablePoints.value.toLocaleString(currentLocaleString.value))
            .replace(/\{label\}/g, pointsLabel.value)
        : t('loyalista.checkout.pointsExceedLimit');
      return false;
    }

    redeeming.value = true;
    error.value = null;
    successMessage.value = null;

    try {
      const response = await fetch('/rest/loyalista/checkout/redeem-points/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ pointsToRedeem }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result: LoyalistaRedeemResponse = await response.json();

      if (result && result.status === 'OK') {
        successMessage.value = t('loyalista.checkout.redeemSuccess');
        selectedOption.value = 'skip';
        customPoints.value = null;

        try {
          await fetchSession();
          await fetchCheckoutData();
          await fetchBasketTotal();
        } catch {
          // Secondary session refetch hiccup must not mask successful coupon creation.
        }
        return true;
      } else {
        const template = result?.message || checkoutData.value?.texts?.errorOccurred;
        const msg = template
          ? template.replace(/\{label\}/g, pointsLabel.value)
          : t('loyalista.checkout.redeemFailed');
        error.value = msg;
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('loyalista.checkout.redeemFailed');
      error.value = msg;
      return false;
    } finally {
      redeeming.value = false;
    }
  };

  const registerCustomer = async (): Promise<boolean> => {
    if (!import.meta.client) {
      return false;
    }

    if (registering.value) {
      return false;
    }

    registering.value = true;
    error.value = null;
    successMessage.value = null;

    try {
      const response = await fetch('/rest/loyalista/account/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result: LoyalistaRegisterResponse = await response.json();

      if (result && (result.success || result.status === 'OK')) {
        successMessage.value = t('loyalista.checkout.registerSuccess');
        await fetchCheckoutData();
        return true;
      } else {
        const msg = result?.message || t('loyalista.checkout.registerFailed');
        error.value = msg;
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('loyalista.checkout.registerFailed');
      error.value = msg;
      return false;
    } finally {
      registering.value = false;
    }
  };

  if (import.meta.client) {
    onMounted(() => {
      if (isCheckoutEnabled.value) {
        fetchCheckoutData();
        fetchBasketTotal();
      }
    });

    watch(
      isCheckoutEnabled,
      (enabled) => {
        if (enabled) {
          fetchCheckoutData();
          fetchBasketTotal();
        }
      },
      { immediate: false },
    );

    watch(
      isAuthorized,
      (newVal) => {
        if (!newVal) {
          checkoutData.value = null;
          basketData.value = null;
          selectedOption.value = 'skip';
          customPoints.value = null;
          error.value = null;
          successMessage.value = null;
        }
        if (isCheckoutEnabled.value) {
          fetchCheckoutData();
          fetchBasketTotal();
        }
      },
      { immediate: false },
    );

    watch(
      () => cart.value?.basketAmount,
      (newVal, oldVal) => {
        if (newVal !== oldVal) {
          fetchBasketTotal();
        }
      },
      { immediate: false },
    );

    watch(
      () => cartGetters.getCouponCode(cart.value),
      (newCode, oldCode) => {
        if (newCode !== oldCode) {
          selectedOption.value = 'skip';
          customPoints.value = null;
          error.value = null;
          if (isCheckoutEnabled.value) {
            fetchCheckoutData();
            fetchBasketTotal();
          }
        }
      },
      { immediate: false },
    );
  }

  return {
    checkoutData,
    basketData,
    loading,
    redeeming,
    registering,
    error,
    successMessage,
    selectedOption,
    customPoints,
    isLoggedIn,
    isLoyaltyMember,
    pointsLabel,
    accountBalance,
    pointToValue,
    revenueToPoint,
    signupBonusPoints,
    partialRedemptionEnabled,
    basketTotal,
    cartEarningPoints,
    hasActiveCoupon,
    maxPointsByBasket,
    maxRedeemablePoints,
    maxDiscountValue,
    renderedRegisteredText,
    renderedNoRedeemText,
    renderedFullRedeemText,
    renderedPartialRedeemText,
    renderedUnregisteredText,
    renderedLoginRequiredText,
    renderedCouponAppliedText,
    fetchCheckoutData,
    fetchBasketTotal,
    redeemPoints,
    registerCustomer,
  };
};
