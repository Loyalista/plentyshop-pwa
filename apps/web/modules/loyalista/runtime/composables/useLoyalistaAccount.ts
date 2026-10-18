import { computed, watch, onMounted } from 'vue';
import type {
  LoyalistaAccountDataResponse,
  LoyalistaAccountApiResponse,
  LoyalistaMutationResult,
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
    birthdayPoints?: number | string | null;
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

  const birthdayFormatted = formatNumber(replacements.birthdayPoints);
  content = content.replace(/\[\s*points_for_birthday\s*\]/gi, birthdayFormatted);
  content = content.replace(/\[\s*birthday_points\s*\]/gi, birthdayFormatted);

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
  const accountData = useState<LoyalistaAccountDataResponse | null>('loyalista-account-data', () => null);
  const fetchRequestIdState = useState<number>('loyalista-account-fetch-id', () => 0);
  const actionRequestIdState = useState<number>('loyalista-account-action-id', () => 0);
  const actionLoading = useState<boolean>('loyalista-account-action-loading', () => false);
  const actionError = useState<string | null>('loyalista-account-action-error', () => null);
  const pendingRefetch = useState<boolean>('loyalista-account-pending-refetch', () => false);

  const getInFlightFetch = (): Promise<LoyalistaAccountDataResponse | null> | null => {
    return (
      ((nuxtApp as unknown as Record<string, unknown>)._loyalistaAccountFetch as
        | Promise<LoyalistaAccountDataResponse | null>
        | null
        | undefined) ?? null
    );
  };

  const setInFlightFetch = (promise: Promise<LoyalistaAccountDataResponse | null> | null) => {
    (nuxtApp as unknown as Record<string, unknown>)._loyalistaAccountFetch = promise;
  };

  const getInFlightAction = (): Promise<LoyalistaMutationResult> | null => {
    return (
      ((nuxtApp as unknown as Record<string, unknown>)._loyalistaAccountAction as
        | Promise<LoyalistaMutationResult>
        | null
        | undefined) ?? null
    );
  };

  const setInFlightAction = (promise: Promise<LoyalistaMutationResult> | null) => {
    (nuxtApp as unknown as Record<string, unknown>)._loyalistaAccountAction = promise;
  };

  /**
   * Resets all cached account state.
   * Triggered on customer logout or user session switch.
   */
  const resetAccountData = () => {
    fetchRequestIdState.value++;
    actionRequestIdState.value++;
    setInFlightFetch(null);
    setInFlightAction(null);
    accountData.value = null;
    error.value = null;
    actionError.value = null;
    loading.value = false;
    actionLoading.value = false;
    pendingRefetch.value = false;
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

    const currentRequestId = ++fetchRequestIdState.value;

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

        if (currentRequestId !== fetchRequestIdState.value || !isAuthorized.value) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const result: LoyalistaAccountApiResponse = await response.json();

        if (currentRequestId !== fetchRequestIdState.value || !isAuthorized.value) {
          return null;
        }

        if (result && result.success && result.data) {
          accountData.value = result.data;
          pendingRefetch.value = false;
          actionError.value = null;
          return result.data;
        } else {
          const msg =
            result?.message || accountData.value?.texts?.errorLoyaltyDataLoad || 'Failed to load loyalty account data';
          error.value = msg;
          if (pendingRefetch.value) {
            actionError.value = msg;
          }
          return null;
        }
      } catch (err: unknown) {
        if (currentRequestId !== fetchRequestIdState.value || !isAuthorized.value) {
          return null;
        }
        const msg = err instanceof Error ? err.message : 'Error loading loyalty account data';
        error.value = msg;
        if (pendingRefetch.value) {
          actionError.value = msg;
        }
        return null;
      } finally {
        if (currentRequestId === fetchRequestIdState.value) {
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

  /**
   * Merchant-configured label for opt-in / join button.
   */
  const joinBtnLabel = computed<string>(() => accountData.value?.texts?.join_btn_label || '');

  /**
   * Merchant-configured label for opt-out / unregister button.
   */
  const unregisterBtnLabel = computed<string>(() => accountData.value?.texts?.btn_label || '');

  /**
   * Disclaimer text for opt-out / unregistering from loyalty program with tokens replaced.
   */
  const disclaimer = computed<string | null>(() => {
    const template = accountData.value?.texts?.disclaimer;
    if (!template || !template.trim()) return null;
    if (/\[value_of_account_balance\]/i.test(template) && accountBalance.value === null) {
      return null;
    }
    return replaceLoyalistaAccountTokens(
      template,
      {
        pointsLabel: pointsLabel.value,
        redeemablePoints: validPoints.value,
        lockedPoints: lockedPoints.value,
        expiringPoints: expiringPoints.value,
        accountBalance: accountBalance.value,
        signupPoints: accountData.value?.signup_points,
      },
      numberLocale.value,
    );
  });

  /**
   * Helper to clean HTML or excessive whitespace from API error messages.
   */
  const sanitizeErrorMessage = (rawMsg: unknown, fallback: string): string => {
    if (typeof rawMsg === 'string' && rawMsg.trim()) {
      return rawMsg
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return fallback;
  };

  interface MutationConfig {
    endpoint: string;
    method?: string;
    body?: BodyInit;
    headers?: Record<string, string>;
    isSuccess: (result: any) => boolean;
    getErrorMessage: (result: any) => string;
    getSuccessMessage?: (result: any) => string;
    defaultErrorMsg: string;
    skipRefetch?: boolean;
  }

  /**
   * Unified mutation runner for customer loyalty account operations.
   * Guarantees session isolation, single in-flight mutation per session,
   * stale response suppression, and coordination of postSuccess with pendingRefetch.
   */
  const executeMutation = async (config: MutationConfig): Promise<LoyalistaMutationResult> => {
    if (pendingRefetch.value) {
      return Promise.resolve({ success: false, postSuccess: true, refetchSuccess: false });
    }
    const inFlight = getInFlightAction();
    if (actionLoading.value || inFlight) {
      return inFlight ?? Promise.resolve({ success: false });
    }
    if (!import.meta.client) return Promise.resolve({ success: false });

    const currentActionId = ++actionRequestIdState.value;
    actionLoading.value = true;
    actionError.value = null;

    const actionPromise = (async (): Promise<LoyalistaMutationResult> => {
      try {
        const response = await fetch(config.endpoint, {
          method: config.method || 'POST',
          headers: {
            Accept: 'application/json',
            ...(config.headers || {}),
          },
          credentials: 'same-origin',
          body: config.body,
        });

        if (currentActionId !== actionRequestIdState.value || !isAuthorized.value) {
          return { success: false };
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (currentActionId !== actionRequestIdState.value || !isAuthorized.value) {
          return { success: false };
        }

        const postSuccess = config.isSuccess(result);

        if (!postSuccess) {
          const cleanMsg = config.getErrorMessage(result);
          actionError.value = cleanMsg;
          actionLoading.value = false;
          return { success: false, postSuccess: false, message: cleanMsg };
        }

        const successMessage = config.getSuccessMessage ? config.getSuccessMessage(result) : undefined;

        // Non-state-mutating requests (such as account merge approval requests)
        // do not alter immediate server account data and do not trigger pendingRefetch
        if (config.skipRefetch) {
          actionLoading.value = false;
          actionError.value = null;
          return { success: true, postSuccess: true, message: successMessage };
        }

        pendingRefetch.value = true;
        const refreshedData = await fetchAccountData(true);

        if (currentActionId !== actionRequestIdState.value || !isAuthorized.value) {
          return { success: false, postSuccess: true, refetchSuccess: false };
        }

        if (refreshedData) {
          pendingRefetch.value = false;
          actionError.value = null;
          actionLoading.value = false;
          return { success: true, postSuccess: true, refetchSuccess: true, message: successMessage };
        } else {
          const refreshError =
            accountData.value?.texts?.errorLoyaltyDataLoad || error.value || 'Failed to load loyalty account data';
          actionError.value = refreshError;
          actionLoading.value = false;
          return { success: false, postSuccess: true, refetchSuccess: false, message: refreshError };
        }
      } catch (err: unknown) {
        if (currentActionId !== actionRequestIdState.value || !isAuthorized.value) {
          return { success: false };
        }
        const errorMsg = err instanceof Error ? err.message : config.defaultErrorMsg;
        actionError.value = errorMsg;
        actionLoading.value = false;
        return { success: false, message: errorMsg };
      } finally {
        if (currentActionId === actionRequestIdState.value) {
          setInFlightAction(null);
        }
      }
    })();

    setInFlightAction(actionPromise);
    return actionPromise;
  };

  /**
   * Registers the currently authenticated customer in the Loyalista loyalty program.
   * Sends POST /account/register/customer/ to the PlentyONE storefront controller.
   */
  const registerCustomer = async (): Promise<LoyalistaMutationResult> => {
    return executeMutation({
      endpoint: '/account/register/customer/',
      isSuccess: (result) => Boolean(result && result.success === true),
      getErrorMessage: (result) =>
        sanitizeErrorMessage(result?.message, accountData.value?.texts?.errorOccurred || 'Registration failed'),
      defaultErrorMsg: 'Registration failed',
    });
  };

  /**
   * Unregisters the currently authenticated customer from the Loyalista loyalty program.
   * Sends POST /account/unregister/customer/ to the PlentyONE storefront controller.
   */
  const unregisterCustomer = async (): Promise<LoyalistaMutationResult> => {
    return executeMutation({
      endpoint: '/account/unregister/customer/',
      isSuccess: (result) => Boolean(result && result.status === 'OK'),
      getErrorMessage: (result) =>
        sanitizeErrorMessage(result?.message, accountData.value?.texts?.errorOccurred || 'Unregistration failed'),
      defaultErrorMsg: 'Unregistration failed',
    });
  };

  /**
   * Submits a customer account merge request to Loyalista for review/approval.
   * Sends POST /account/merge/customer/ with parameter customer_email_address.
   * As this submits an application rather than immediately altering balances,
   * it does not depend on immediate point balance changes.
   */
  const mergeCustomer = async (email: string): Promise<LoyalistaMutationResult> => {
    const trimmed = (email || '').trim();
    if (!trimmed || trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      const msg =
        accountData.value?.texts?.errorOccurred?.replace('{error}', 'Invalid email') ||
        'Ungültige oder fehlende E-Mail-Adresse';
      actionError.value = msg;
      return Promise.resolve({ success: false, message: msg });
    }

    const body = new URLSearchParams();
    body.append('customer_email_address', trimmed);

    return executeMutation({
      endpoint: '/account/merge/customer/',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      skipRefetch: true,
      isSuccess: (result) => Boolean(result && result.status === 'OK'),
      getErrorMessage: (result) =>
        sanitizeErrorMessage(result?.message, accountData.value?.texts?.errorOccurred || 'Merge failed'),
      defaultErrorMsg: 'Merge failed',
    });
  };

  /**
   * Saves customer birthday for loyalty program bonus points.
   * Validates format (YYYY-MM-DD), calendar validity, and age plausibility (<= today, >= -120 years).
   * Validated using local calendar date parts to avoid timezone/UTC offset shifts.
   * Sends POST /rest/loyalista/widget/save-birthday/.
   * Strictly verifies backend contract: success signal requires result.success === true.
   */
  const saveBirthday = async (birthday: string): Promise<LoyalistaMutationResult> => {
    const trimmed = (birthday || '').trim();
    if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const msg = accountData.value?.texts?.errorEnterBirthday || 'Bitte geben Sie ein Geburtsdatum ein.';
      actionError.value = msg;
      return Promise.resolve({ success: false, message: msg });
    }

    const [year, month, day] = trimmed.split('-').map(Number);
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      const msg = accountData.value?.texts?.errorBirthdaySave || 'Ungültiges Datumsformat';
      actionError.value = msg;
      return Promise.resolve({ success: false, message: msg });
    }

    // Days in month check (handles leap years correctly)
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      const msg = accountData.value?.texts?.errorBirthdaySave || 'Ungültiges Datumsformat';
      actionError.value = msg;
      return Promise.resolve({ success: false, message: msg });
    }

    // Pure calendar date comparison without UTC/timezone offsets
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth() + 1;
    const todayD = now.getDate();

    const isFuture =
      year > todayY || (year === todayY && month > todayM) || (year === todayY && month === todayM && day > todayD);

    const minY = todayY - 120;
    const isTooOld =
      year < minY || (year === minY && month < todayM) || (year === minY && month === todayM && day < todayD);

    if (isFuture || isTooOld) {
      const msg = accountData.value?.texts?.errorBirthdaySave || 'Ungültiges Datumsformat';
      actionError.value = msg;
      return Promise.resolve({ success: false, message: msg });
    }

    const body = new URLSearchParams();
    body.append('birthday', trimmed);

    return executeMutation({
      endpoint: '/rest/loyalista/widget/save-birthday/',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      isSuccess: (result) => Boolean(result && result.success === true),
      getErrorMessage: (result) =>
        sanitizeErrorMessage(
          result?.message,
          accountData.value?.texts?.errorBirthdaySave ||
            accountData.value?.texts?.errorOccurred ||
            'Fehler beim Speichern des Geburtsdatums.',
        ),
      getSuccessMessage: (result) =>
        typeof result?.message === 'string' && result.message.trim()
          ? result.message
          : accountData.value?.texts?.successBirthdaySaved || '',
      defaultErrorMsg: 'Fehler beim Speichern des Geburtsdatums.',
    });
  };

  /**
   * Hint text for customer birthday with tokens replaced.
   */
  const birthdayHint = computed<string | null>(() => {
    const template = accountData.value?.texts?.birthday_hint;
    if (!template || !template.trim()) return null;
    return replaceLoyalistaAccountTokens(
      template,
      {
        pointsLabel: pointsLabel.value,
        birthdayPoints: accountData.value?.birthday_points,
      },
      numberLocale.value,
    );
  });

  /**
   * Saved birthday for authenticated customer.
   */
  const customerBirthday = computed<string | null>(() => accountData.value?.customer?.birthday || null);

  /**
   * Whether the authenticated customer has already saved their birthday.
   */
  const hasBirthday = computed<boolean>(() => Boolean(accountData.value?.customer?.birthday));

  /**
   * Merchant-configured label for save birthday button.
   */
  const saveBtnLabel = computed<string>(() => accountData.value?.texts?.save_btn_label || '');

  /**
   * Hint text for account merge with tokens replaced.
   */
  const joinRequestHint = computed<string | null>(() => {
    const template = accountData.value?.texts?.join_request_hint;
    if (!template || !template.trim()) return null;
    return replaceLoyalistaAccountTokens(
      template,
      {
        pointsLabel: pointsLabel.value,
        dateOfExpiry: expiryDaysThreshold.value,
      },
      numberLocale.value,
    );
  });

  /**
   * Merchant-configured label for account merge button.
   */
  const mergeBtnLabel = computed<string>(() => accountData.value?.texts?.merge_btn_label || '');

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
    joinBtnLabel,
    unregisterBtnLabel,
    disclaimer,
    actionLoading,
    actionError,
    pendingRefetch,
    registerCustomer,
    unregisterCustomer,
    mergeCustomer,
    saveBirthday,
    birthdayHint,
    customerBirthday,
    hasBirthday,
    saveBtnLabel,
    joinRequestHint,
    mergeBtnLabel,
  };
};
