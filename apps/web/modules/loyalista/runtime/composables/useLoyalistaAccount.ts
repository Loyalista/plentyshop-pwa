import { computed, watch, onMounted } from 'vue';
import type {
  LoyalistaAccountDataResponse,
  LoyalistaAccountApiResponse,
} from '../../types/account';

/**
 * Replaces placeholder tokens in account text templates.
 *
 * Supported tokens:
 * - [points_label]                        Configured label for points (e.g. "Punkte" / "Points")
 * - [total_number_of_redeemable_points]   Redeemable points balance
 * - [total_number_of_locked_points]       Locked points balance
 * - [amount_of_points]                    Expiring points balance
 * - [date_of_expiry]                      Expiry threshold in days
 * - [value_of_account_balance]            Total monetary value of points balance
 * - [signup_points]                       Signup bonus points
 * - [points_for_signup]                   Signup bonus points (synonym)
 */
export const replaceLoyalistaAccountTokens = (
  template: string,
  replacements: {
    pointsLabel?: string | null;
    redeemablePoints?: number | string | null;
    lockedPoints?: number | string | null;
    expiringPoints?: number | string | null;
    dateOfExpiry?: number | string | null;
    accountBalance?: number | string | null;
    signupPoints?: number | string | null;
  },
  locale = 'de-DE',
): string => {
  let content = template;

  const formatNumber = (val: number | string | null | undefined): string => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? String(val) : num.toLocaleString(locale);
  };

  const label = replacements.pointsLabel || '';
  content = content.replace(/\[points_label\]/gi, label);

  const redeemableFormatted = formatNumber(replacements.redeemablePoints);
  content = content.replace(/\[total_number_of_redeemable_points\]/gi, redeemableFormatted);

  const lockedFormatted = formatNumber(replacements.lockedPoints);
  content = content.replace(/\[total_number_of_locked_points\]/gi, lockedFormatted);

  const expiringFormatted = formatNumber(replacements.expiringPoints);
  content = content.replace(/\[amount_of_points\]/gi, expiringFormatted);

  const expiryDays =
    replacements.dateOfExpiry !== undefined && replacements.dateOfExpiry !== null
      ? String(replacements.dateOfExpiry)
      : '';
  content = content.replace(/\[date_of_expiry\]/gi, expiryDays);

  const balanceFormatted =
    replacements.accountBalance !== undefined && replacements.accountBalance !== null
      ? String(replacements.accountBalance)
      : '';
  content = content.replace(/\[value_of_account_balance\]/gi, balanceFormatted);

  const signupFormatted = formatNumber(replacements.signupPoints);
  content = content.replace(/\[signup_points\]/gi, signupFormatted);
  content = content.replace(/\[points_for_signup\]/gi, signupFormatted);

  return content;
};

/**
 * Composable for managing customer loyalty account data and points overview.
 *
 * Coordinates fetching personalized loyalty data, tracks customer session
 * changes (login, logout, session switch), and prepares token-replaced localized
 * merchant texts for presentation.
 */
export const useLoyalistaAccount = () => {
  const nuxtApp = useNuxtApp();
  const { isAuthorized } = useCustomer();
  const { locale } = useI18n();

  const loading = useState<boolean>('loyalista-account-loading', () => false);
  const error = useState<string | null>('loyalista-account-error', () => null);
  const accountData = useState<LoyalistaAccountDataResponse | null>(
    'loyalista-account-data',
    () => null,
  );
  const requestIdState = useState<number>('loyalista-account-request-id', () => 0);

  const getInFlightFetch = (): Promise<LoyalistaAccountDataResponse | null> | null => {
    return (
      ((nuxtApp as unknown as Record<string, unknown>)._loyalistaAccountFetch as
        | Promise<LoyalistaAccountDataResponse | null>
        | null
        | undefined) ?? null
    );
  };

  const setInFlightFetch = (
    promise: Promise<LoyalistaAccountDataResponse | null> | null,
  ) => {
    (nuxtApp as unknown as Record<string, unknown>)._loyalistaAccountFetch = promise;
  };

  /**
   * Resets all cached account state.
   * Triggered on customer logout or user session switch.
   */
  const resetAccountData = () => {
    requestIdState.value++;
    setInFlightFetch(null);
    accountData.value = null;
    error.value = null;
    loading.value = false;
  };

  /**
   * Fetches account data for the authenticated customer.
   * Runs client-side to keep customer data out of SSR responses.
   *
   * @param force - If true, bypasses in-flight request deduplication and cached state
   */
  const fetchAccountData = async (force = false): Promise<LoyalistaAccountDataResponse | null> => {
    if (!import.meta.client) {
      return null;
    }

    if (!isAuthorized.value) {
      resetAccountData();
      return null;
    }

    if (accountData.value && !force) {
      return accountData.value;
    }

    const inFlight = getInFlightFetch();
    if (inFlight && !force) {
      return inFlight;
    }

    loading.value = true;
    error.value = null;

    const currentRequestId = ++requestIdState.value;

    const fetchPromise = (async () => {
      try {
        const endpoint = '/rest/loyalista/widget/account-data/';

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          credentials: 'same-origin',
        });

        if (currentRequestId !== requestIdState.value || !isAuthorized.value) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const result: LoyalistaAccountApiResponse = await response.json();

        if (currentRequestId !== requestIdState.value || !isAuthorized.value) {
          return null;
        }

        if (result && result.success && result.data) {
          accountData.value = result.data;
          return result.data;
        } else {
          const msg =
            result?.message ||
            accountData.value?.texts?.errorLoyaltyDataLoad ||
            'Failed to load loyalty account data';
          error.value = msg;
          return null;
        }
      } catch (err: unknown) {
        if (currentRequestId !== requestIdState.value || !isAuthorized.value) {
          return null;
        }
        const msg = err instanceof Error ? err.message : 'Error loading loyalty account data';
        error.value = msg;
        return null;
      } finally {
        if (currentRequestId === requestIdState.value) {
          loading.value = false;
          setInFlightFetch(null);
        }
      }
    })();

    setInFlightFetch(fetchPromise);
    return fetchPromise;
  };

  /**
   * Whether the authenticated customer is registered in the loyalty program.
   */
  const isRegistered = computed<boolean>(() => Boolean(accountData.value?.user_registered));

  /**
   * Redeemable points balance.
   */
  const validPoints = computed<number>(() => {
    const raw = accountData.value?.all_points?.valid_points;
    return typeof raw === 'number' ? raw : parseFloat(String(raw || 0)) || 0;
  });

  /**
   * Locked points balance awaiting order completion.
   */
  const lockedPoints = computed<number>(() => {
    const raw = accountData.value?.all_points?.locked_points;
    return typeof raw === 'number' ? raw : parseFloat(String(raw || 0)) || 0;
  });

  /**
   * Points expiring within the configured threshold period.
   */
  const expiringPoints = computed<number>(() => {
    const raw = accountData.value?.all_points?.expiring_in_threshold_points;
    return typeof raw === 'number' ? raw : parseFloat(String(raw || 0)) || 0;
  });

  /**
   * Total points balance combining redeemable and locked points.
   */
  const totalPoints = computed<number>(() => validPoints.value + lockedPoints.value);

  /**
   * Conversion rate from points to currency value.
   */
  const pointToConversion = computed<number | null>(() => {
    const raw = accountData.value?.point_to_conversion || accountData.value?.point_to_value;
    if (raw === undefined || raw === null || raw === '') {
      return null;
    }
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return !isNaN(num) && num > 0 ? num : null;
  });

  /**
   * Total monetary value of points in account currency.
   */
  const accountBalance = computed<string | null>(() => {
    if (pointToConversion.value === null) {
      return null;
    }
    const total = totalPoints.value * pointToConversion.value;
    return total.toFixed(2);
  });

  /**
   * Expiry threshold in days from the backend configuration.
   */
  const expiryDaysThreshold = computed<number | string>(() => {
    return accountData.value?.expiry_days_threshold ?? '';
  });

  /**
   * Merchant-configured label for points (e.g. "Punkte" / "Points").
   */
  const pointsLabel = computed<string>(() => accountData.value?.texts?.points_label || '');

  /**
   * Merchant-configured category labels from backend translations.
   */
  const redeemableLabel = computed<string>(() => accountData.value?.texts?.jsRedeemablePoints || '');
  const lockedLabel = computed<string>(() => accountData.value?.texts?.jsLockedPoints || '');
  const expiringLabel = computed<string>(() => accountData.value?.texts?.jsExpiringPoints || '');

  /**
   * Merchant-configured heading for account widget.
   */
  const heading = computed<string>(() => accountData.value?.texts?.heading || '');

  const numberLocale = computed(() => (locale.value === 'de' ? 'de-DE' : 'en-US'));

  /**
   * Hint text for redeemable points with tokens replaced.
   */
  const redeemHint = computed<string | null>(() => {
    const template = accountData.value?.texts?.redeem_hint;
    if (!template || !template.trim()) return null;
    if (/\[value_of_account_balance\]/i.test(template) && accountBalance.value === null) {
      return null;
    }
    return replaceLoyalistaAccountTokens(
      template,
      {
        pointsLabel: pointsLabel.value,
        redeemablePoints: validPoints.value,
        dateOfExpiry: expiryDaysThreshold.value,
        accountBalance: accountBalance.value,
      },
      numberLocale.value,
    );
  });

  /**
   * Hint text for locked points with tokens replaced.
   */
  const lockedHint = computed<string | null>(() => {
    const template = accountData.value?.texts?.locked_hint;
    if (!template || !template.trim()) return null;
    return replaceLoyalistaAccountTokens(
      template,
      {
        pointsLabel: pointsLabel.value,
        lockedPoints: lockedPoints.value,
      },
      numberLocale.value,
    );
  });

  /**
   * Hint text for expiring points with tokens replaced.
   */
  const expiryHint = computed<string | null>(() => {
    const template = accountData.value?.texts?.expiry_hint;
    if (!template || !template.trim()) return null;
    if (/\[value_of_account_balance\]/i.test(template) && accountBalance.value === null) {
      return null;
    }
    if (
      /\[date_of_expiry\]/i.test(template) &&
      (expiryDaysThreshold.value === '' ||
        expiryDaysThreshold.value === null ||
        expiryDaysThreshold.value === undefined)
    ) {
      return null;
    }
    return replaceLoyalistaAccountTokens(
      template,
      {
        pointsLabel: pointsLabel.value,
        expiringPoints: expiringPoints.value,
        dateOfExpiry: expiryDaysThreshold.value,
      },
      numberLocale.value,
    );
  });

  /**
   * Offer text for logged-in but unregistered customers with tokens replaced.
   */
  const unregisteredOffer = computed<string | null>(() => {
    const template = accountData.value?.texts?.unregistered_offer;
    if (!template || !template.trim()) return null;
    return replaceLoyalistaAccountTokens(
      template,
      {
        pointsLabel: pointsLabel.value,
        signupPoints: accountData.value?.signup_points,
      },
      numberLocale.value,
    );
  });

  if (import.meta.client) {
    // Clear cached state on logout and fetch fresh data on customer login
    watch(
      isAuthorized,
      (authorized) => {
        if (!authorized) {
          resetAccountData();
        } else {
          fetchAccountData(true);
        }
      },
      { immediate: false },
    );

    onMounted(() => {
      if (isAuthorized.value && !accountData.value && !loading.value) {
        fetchAccountData();
      }
    });
  }

  return {
    loading,
    error,
    accountData,
    fetchAccountData,
    resetAccountData,
    isAuthorized,
    isRegistered,
    validPoints,
    lockedPoints,
    expiringPoints,
    totalPoints,
    pointToConversion,
    accountBalance,
    expiryDaysThreshold,
    pointsLabel,
    redeemableLabel,
    lockedLabel,
    expiringLabel,
    heading,
    redeemHint,
    lockedHint,
    expiryHint,
    unregisteredOffer,
  };
};
