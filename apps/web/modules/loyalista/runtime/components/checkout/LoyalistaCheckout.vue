<template>
  <div
    v-if="isEnabled"
    :style="wrapperStyle"
    class="loyalista-checkout mt-4"
    data-testid="loyalista-checkout"
  >
    <div
      :class="[
        'rounded-lg p-4 text-neutral-800 transition-all',
        {
          'shadow-md @md:shadow-lg': isDropShadow,
          border: hasBorders,
        },
      ]"
      :style="cardStyle"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <h3 class="typography-headline-5 font-semibold text-neutral-900">
          {{ checkoutData?.texts?.heading || t('loyalista.checkout.heading') }}
        </h3>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !checkoutData" class="flex items-center justify-center py-4 text-neutral-500">
        <SfLoaderCircular size="sm" class="mr-2" />
        <span class="text-sm">{{ t('loyalista.checkout.loading') }}</span>
      </div>

      <!-- State 1: Guest Visitor -->
      <div v-else-if="!isLoggedIn" class="space-y-3" data-testid="loyalista-checkout-guest">
        <p class="text-sm text-neutral-700 leading-relaxed">
          {{ renderedLoginRequiredText || t('loyalista.checkout.guestNotice') }}
        </p>
        <div>
          <UiButton
            :tag="NuxtLink"
            :to="{ path: localePath(paths.authLogin), query: { redirect: currentRoutePath } }"
            variant="secondary"
            size="sm"
            data-testid="loyalista-checkout-guest-login-btn"
          >
            {{ t('loyalista.checkout.login') }}
          </UiButton>
        </div>
      </div>

      <!-- State 2: Unregistered Customer -->
      <div v-else-if="!isLoyaltyMember" class="space-y-3" data-testid="loyalista-checkout-unregistered">
        <div class="flex items-start gap-2">
          <input
            id="loyalista-checkout-optin"
            v-model="acceptParticipation"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            data-testid="loyalista-checkout-optin-checkbox"
          />
          <label for="loyalista-checkout-optin" class="text-sm text-neutral-700 cursor-pointer select-none leading-relaxed">
            {{ renderedUnregisteredText }}
          </label>
        </div>
        <div>
          <UiButton
            type="button"
            variant="primary"
            size="sm"
            :disabled="!acceptParticipation || registering"
            data-testid="loyalista-checkout-register-btn"
            @click="handleRegister"
          >
            <SfLoaderCircular v-if="registering" size="sm" class="mr-1" />
            <span>{{ checkoutData?.texts?.btn_participate || t('loyalista.checkout.participate') }}</span>
          </UiButton>
        </div>
      </div>

      <!-- State 3: Registered Loyalty Member -->
      <div v-else class="space-y-3" data-testid="loyalista-checkout-registered">
        <!-- Overview info -->
        <p class="text-sm text-neutral-700 leading-relaxed">
          {{ renderedRegisteredText }}
        </p>

        <hr class="border-neutral-200 my-2" />

        <!-- Existing coupon already applied -->
        <div
          v-if="hasActiveCoupon"
          class="flex items-start gap-2.5 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-sm"
          data-testid="loyalista-checkout-coupon-notice"
        >
          <SfIconInfo class="shrink-0 text-blue-600 mt-0.5" size="sm" />
          <p class="leading-relaxed">
            {{ renderedCouponAppliedText || checkoutData?.texts?.coupon_already_applied }}
          </p>
        </div>

        <!-- Redemption options when no coupon is applied -->
        <div v-else class="space-y-2.5" data-testid="loyalista-checkout-redemption-options">
          <!-- Option: Skip -->
          <label class="flex items-center gap-2 cursor-pointer text-sm text-neutral-800">
            <input
              v-model="selectedOption"
              type="radio"
              value="skip"
              name="loyalista_checkout_redemption"
              class="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
              data-testid="loyalista-option-skip"
            />
            <span>{{ renderedNoRedeemText || t('loyalista.checkout.noRedeem') }}</span>
          </label>

          <!-- Option: Full Redeem -->
          <label
            :class="[
              'flex items-center gap-2 text-sm',
              maxRedeemablePoints > 0 ? 'cursor-pointer text-neutral-800' : 'cursor-not-allowed text-neutral-400',
            ]"
          >
            <input
              v-model="selectedOption"
              type="radio"
              value="all"
              name="loyalista_checkout_redemption"
              :disabled="maxRedeemablePoints <= 0"
              class="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
              data-testid="loyalista-option-all"
            />
            <span>{{ renderedFullRedeemText }}</span>
          </label>

          <!-- Option: Partial Redeem (if enabled) -->
          <template v-if="partialRedemptionEnabled">
            <label
              :class="[
                'flex items-center gap-2 text-sm',
                maxRedeemablePoints > 0 ? 'cursor-pointer text-neutral-800' : 'cursor-not-allowed text-neutral-400',
              ]"
            >
              <input
                v-model="selectedOption"
                type="radio"
                value="custom"
                name="loyalista_checkout_redemption"
                :disabled="maxRedeemablePoints <= 0"
                class="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
                data-testid="loyalista-option-custom"
              />
              <span>{{ renderedPartialRedeemText }}</span>
            </label>

            <!-- Partial Points Input -->
            <div
              v-if="selectedOption === 'custom'"
              class="ml-6 flex flex-col gap-1.5"
              data-testid="loyalista-custom-input-container"
            >
              <div class="flex items-center gap-2">
                <input
                  v-model.number="customPointsInput"
                  type="number"
                  min="1"
                  :max="maxRedeemablePoints"
                  step="1"
                  placeholder="0"
                  class="w-32 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  data-testid="loyalista-custom-points-input"
                  @keypress="handleIntegerOnly"
                />
                <span class="text-sm font-medium text-neutral-600">
                  {{ pointsLabel }} ({{ estimatedDiscountFormatted }})
                </span>
              </div>
              <p class="text-xs text-neutral-500">
                {{ t('loyalista.checkout.maxRedeemableHint', { max: maxRedeemablePoints, label: pointsLabel }) }}
              </p>
            </div>
          </template>

          <!-- Apply Button -->
          <div v-if="selectedOption !== 'skip'" class="pt-2">
            <UiButton
              type="button"
              variant="primary"
              size="sm"
              :disabled="isApplyDisabled || redeeming"
              data-testid="loyalista-checkout-apply-btn"
              @click="handleRedeem"
            >
              <SfLoaderCircular v-if="redeeming" size="sm" class="mr-1" />
              <span>{{ checkoutData?.texts?.btn_apply || t('loyalista.checkout.apply') }}</span>
            </UiButton>
          </div>
        </div>

        <!-- Feedback & Error Messages -->
        <div
          v-if="error"
          class="flex items-start gap-2 p-3 rounded-md bg-negative-50 border border-negative-200 text-negative-800 text-sm mt-3"
          data-testid="loyalista-checkout-error"
        >
          <SfIconWarning class="shrink-0 text-negative-600 mt-0.5" size="sm" />
          <p class="leading-relaxed">{{ error }}</p>
        </div>

        <div
          v-if="successMessage"
          class="flex items-start gap-2 p-3 rounded-md bg-positive-50 border border-positive-200 text-positive-800 text-sm mt-3"
          data-testid="loyalista-checkout-success"
        >
          <SfIconCheck class="shrink-0 text-positive-600 mt-0.5" size="sm" />
          <p class="leading-relaxed">{{ successMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, resolveComponent } from 'vue';
import { SfLoaderCircular, SfIconInfo, SfIconWarning, SfIconCheck } from '@storefront-ui/vue';

const { t } = useI18n();
const localePath = useLocalizedPath();
const route = useRoute();
const NuxtLink = resolveComponent('NuxtLink');
const { format } = usePriceFormatter();

// Site settings for activation & styling
const { getBooleanSetting: getEnabled } = useSiteSettings('loyalistaCheckoutEnabled');
const { getBooleanSetting: getDropShadow } = useSiteSettings('loyalistaCheckoutDropShadow');
const { getBooleanSetting: getBorders } = useSiteSettings('loyalistaCheckoutBorders');
const { getSetting: getBorderColor } = useSiteSettings('loyalistaCheckoutBorderColor');
const { getSetting: getBgColor } = useSiteSettings('loyalistaCheckoutBackgroundColor');
const { getNumberSetting: getPaddingTop } = useSiteSettings('loyalistaCheckoutPaddingTop');
const { getNumberSetting: getPaddingBottom } = useSiteSettings('loyalistaCheckoutPaddingBottom');
const { getNumberSetting: getPaddingLeft } = useSiteSettings('loyalistaCheckoutPaddingLeft');
const { getNumberSetting: getPaddingRight } = useSiteSettings('loyalistaCheckoutPaddingRight');

const isEnabled = computed<boolean>(() => getEnabled(true));
const isDropShadow = computed<boolean>(() => getDropShadow(true));
const hasBorders = computed<boolean>(() => getBorders(true));

const cardStyle = computed(() => {
  const style: Record<string, string | undefined> = {};
  if (hasBorders.value) {
    style.borderColor = getBorderColor() || '#E5E7EB';
  }
  const bg = getBgColor() || '#FFFFFF';
  if (bg) {
    style.backgroundColor = bg;
  }
  return style;
});

const wrapperStyle = computed(() => {
  return {
    paddingTop: `${getPaddingTop(0)}px`,
    paddingBottom: `${getPaddingBottom(0)}px`,
    paddingLeft: `${getPaddingLeft(0)}px`,
    paddingRight: `${getPaddingRight(0)}px`,
  };
});

const currentRoutePath = computed(() => route.fullPath);

const {
  checkoutData,
  loading,
  redeeming,
  registering,
  error,
  successMessage,
  selectedOption,
  isLoggedIn,
  isLoyaltyMember,
  pointsLabel,
  pointToValue,
  partialRedemptionEnabled,
  hasActiveCoupon,
  maxRedeemablePoints,
  renderedRegisteredText,
  renderedNoRedeemText,
  renderedFullRedeemText,
  renderedPartialRedeemText,
  renderedUnregisteredText,
  renderedLoginRequiredText,
  renderedCouponAppliedText,
  redeemPoints,
  registerCustomer,
} = useLoyalistaCheckout();

const acceptParticipation = ref<boolean>(false);
const customPointsInput = ref<number | null>(null);

const estimatedDiscountFormatted = computed<string>(() => {
  const pts = Number(customPointsInput.value) || 0;
  const val = pts * pointToValue.value;
  return format(val) || '';
});

const isApplyDisabled = computed<boolean>(() => {
  if (selectedOption.value === 'skip') {
    return true;
  }
  if (maxRedeemablePoints.value <= 0) {
    return true;
  }
  if (selectedOption.value === 'all') {
    return false;
  }
  if (selectedOption.value === 'custom') {
    const pts = customPointsInput.value;
    if (pts === null || pts === undefined || !Number.isInteger(pts)) {
      return true;
    }
    if (pts <= 0 || pts > maxRedeemablePoints.value) {
      return true;
    }
    return false;
  }
  return true;
});

const handleIntegerOnly = (event: KeyboardEvent) => {
  if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
    event.preventDefault();
  }
};

const handleRedeem = async () => {
  if (selectedOption.value === 'all') {
    await redeemPoints(maxRedeemablePoints.value);
  } else if (selectedOption.value === 'custom') {
    const pts = Number(customPointsInput.value);
    if (Number.isInteger(pts) && pts > 0 && pts <= maxRedeemablePoints.value) {
      await redeemPoints(pts);
    }
  }
};

const handleRegister = async () => {
  if (!acceptParticipation.value) {
    return;
  }
  await registerCustomer();
};
</script>
