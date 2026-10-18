<template>
  <div class="loyalista-account-points" data-testid="loyalista-account-points">
    <div
      v-if="loading && !accountData"
      class="flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-600 my-4"
      data-testid="loyalista-account-loading"
    >
      <SfLoaderCircular size="lg" class="mb-4 text-primary-500" />
      <p class="typography-text-base font-medium">
        {{ t('loyalista.account.loading') }}
      </p>
    </div>

    <div
      v-else-if="error && !accountData"
      class="p-6 bg-negative-50 border border-negative-300 rounded-lg text-negative-800 my-4"
      data-testid="loyalista-account-error"
    >
      <div class="flex items-start gap-3">
        <SfIconWarning class="text-negative-600 shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="typography-text-base font-semibold mb-2">
            {{ t('loyalista.account.error') }}
          </p>
          <p class="typography-text-sm text-negative-700 mb-4">
            {{ error }}
          </p>
          <UiButton
            type="button"
            size="sm"
            data-testid="loyalista-account-retry-button"
            @click="fetchAccountData(true)"
          >
            {{ t('loyalista.account.retry') }}
          </UiButton>
        </div>
      </div>
    </div>

    <div v-else-if="isRegistered" class="space-y-6 my-4" data-testid="loyalista-account-registered">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          class="flex flex-col p-5 bg-white border border-neutral-200 rounded-lg shadow-sm"
          data-testid="loyalista-card-redeemable"
        >
          <span v-if="redeemableLabel" class="typography-text-sm font-medium text-neutral-600 mb-2">
            {{ redeemableLabel }}
          </span>

          <div class="my-2">
            <span class="typography-headline-2 font-bold text-neutral-900">
              {{ formatPoints(validPoints) }}
            </span>
            <span v-if="pointsLabel" class="ml-1.5 typography-headline-4 font-normal text-neutral-600">
              {{ pointsLabel }}
            </span>
          </div>

          <p v-if="redeemHint" class="typography-text-xs text-neutral-600 mt-auto pt-2 border-t border-neutral-100">
            {{ redeemHint }}
          </p>
        </div>

        <div
          class="flex flex-col p-5 bg-white border border-neutral-200 rounded-lg shadow-sm"
          data-testid="loyalista-card-locked"
        >
          <span v-if="lockedLabel" class="typography-text-sm font-medium text-neutral-600 mb-2">
            {{ lockedLabel }}
          </span>

          <div class="my-2">
            <span class="typography-headline-2 font-bold text-neutral-900">
              {{ formatPoints(lockedPoints) }}
            </span>
            <span v-if="pointsLabel" class="ml-1.5 typography-headline-4 font-normal text-neutral-600">
              {{ pointsLabel }}
            </span>
          </div>

          <p v-if="lockedHint" class="typography-text-xs text-neutral-600 mt-auto pt-2 border-t border-neutral-100">
            {{ lockedHint }}
          </p>
        </div>

        <div
          class="flex flex-col p-5 bg-white border border-neutral-200 rounded-lg shadow-sm"
          data-testid="loyalista-card-expiring"
        >
          <span v-if="expiringLabel" class="typography-text-sm font-medium text-neutral-600 mb-2">
            {{ expiringLabel }}
          </span>

          <div class="my-2">
            <span
              :class="[
                'typography-headline-2 font-bold',
                expiringPoints > 0 ? 'text-negative-700' : 'text-neutral-900',
              ]"
            >
              {{ formatPoints(expiringPoints) }}
            </span>
            <span v-if="pointsLabel" class="ml-1.5 typography-headline-4 font-normal text-neutral-600">
              {{ pointsLabel }}
            </span>
          </div>

          <p v-if="expiryHint" class="typography-text-xs text-neutral-600 mt-auto pt-2 border-t border-neutral-100">
            {{ expiryHint }}
          </p>
        </div>
      </div>

      <LoyalistaAccountBirthday />

      <LoyalistaAccountMerge />

      <div
        v-if="disclaimer && unregisterBtnLabel"
        class="mt-8 pt-6 border-t border-neutral-200"
        data-testid="loyalista-optout-section"
      >
        <div class="mb-4">
          <label
            class="flex items-start gap-3 cursor-pointer select-none"
            data-testid="loyalista-optout-checkbox-label"
          >
            <SfCheckbox
              v-model="optOutConsent"
              :disabled="pendingRefetch || actionLoading"
              class="mt-0.5 text-primary-500"
              data-testid="loyalista-optout-checkbox"
            />
            <span class="typography-text-sm text-neutral-700 leading-relaxed" data-testid="loyalista-optout-disclaimer">
              {{ disclaimer }}
            </span>
          </label>
        </div>

        <div
          v-if="actionError"
          class="mb-4 p-3 bg-negative-50 border border-negative-200 rounded text-negative-800 text-sm flex items-center gap-2"
          data-testid="loyalista-optout-error"
        >
          <SfIconWarning class="text-negative-600 shrink-0" size="sm" />
          <span>{{ actionError }}</span>
        </div>

        <UiButton
          v-if="pendingRefetch"
          type="button"
          size="sm"
          :disabled="loading"
          data-testid="loyalista-optout-retry-button"
          @click="fetchAccountData(true)"
        >
          <SfLoaderCircular v-if="loading" size="sm" class="mr-2 text-white" />
          {{ t('loyalista.account.retry') }}
        </UiButton>

        <UiButton
          v-else
          type="button"
          variant="secondary"
          size="sm"
          :disabled="!optOutConsent || actionLoading"
          class="!text-negative-700 !border-negative-300 hover:!bg-negative-50"
          data-testid="loyalista-optout-button"
          @click="handleUnregister"
        >
          <SfLoaderCircular v-if="actionLoading" size="sm" class="mr-2 text-negative-700" />
          {{ unregisterBtnLabel }}
        </UiButton>
      </div>
    </div>

    <div
      v-else-if="accountData && !isRegistered && unregisteredOffer && joinBtnLabel"
      class="p-6 bg-white border border-neutral-200 rounded-lg shadow-sm my-4"
      data-testid="loyalista-account-unregistered"
    >
      <div class="mb-6">
        <label class="flex items-start gap-3 cursor-pointer select-none" data-testid="loyalista-optin-checkbox-label">
          <SfCheckbox
            v-model="optInConsent"
            :disabled="pendingRefetch || actionLoading"
            class="mt-0.5 text-primary-500"
            data-testid="loyalista-optin-checkbox"
          />
          <span
            class="typography-text-base text-neutral-800 leading-relaxed"
            data-testid="loyalista-unregistered-offer"
          >
            {{ unregisteredOffer }}
          </span>
        </label>
      </div>

      <div
        v-if="actionError"
        class="mb-4 p-3 bg-negative-50 border border-negative-200 rounded text-negative-800 text-sm flex items-center gap-2"
        data-testid="loyalista-optin-error"
      >
        <SfIconWarning class="text-negative-600 shrink-0" size="sm" />
        <span>{{ actionError }}</span>
      </div>

      <UiButton
        v-if="pendingRefetch"
        type="button"
        :disabled="loading"
        class="px-6 py-2.5"
        data-testid="loyalista-optin-retry-button"
        @click="fetchAccountData(true)"
      >
        <SfLoaderCircular v-if="loading" size="sm" class="mr-2 text-white" />
        {{ t('loyalista.account.retry') }}
      </UiButton>

      <UiButton
        v-else
        type="button"
        :disabled="!optInConsent || actionLoading"
        class="px-6 py-2.5"
        data-testid="loyalista-optin-button"
        @click="handleRegister"
      >
        <SfLoaderCircular v-if="actionLoading" size="sm" class="mr-2 text-white" />
        {{ joinBtnLabel }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { SfLoaderCircular, SfIconWarning, SfCheckbox } from '@storefront-ui/vue';
import { useLoyalistaAccount } from '../../composables/useLoyalistaAccount';
import LoyalistaAccountBirthday from './LoyalistaAccountBirthday.vue';
import LoyalistaAccountMerge from './LoyalistaAccountMerge.vue';

const { t, locale } = useI18n();

const {
  loading,
  error,
  accountData,
  fetchAccountData,
  isRegistered,
  validPoints,
  lockedPoints,
  expiringPoints,
  pointsLabel,
  redeemableLabel,
  lockedLabel,
  expiringLabel,
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
  isAuthorized,
} = useLoyalistaAccount();

const optInConsent = ref(false);
const optOutConsent = ref(false);

/**
 * Resets checkbox consent states upon registration status change or logout
 * to prevent carrying consent over between opt-in, opt-out, or sessions.
 */
watch([isRegistered, isAuthorized], () => {
  optInConsent.value = false;
  optOutConsent.value = false;
});

const handleRegister = async () => {
  if (!optInConsent.value || actionLoading.value || pendingRefetch.value) return;
  const res = await registerCustomer();
  if (res.success) {
    optInConsent.value = false;
  }
};

const handleUnregister = async () => {
  if (!optOutConsent.value || actionLoading.value || pendingRefetch.value) return;
  const res = await unregisterCustomer();
  if (res.success) {
    optOutConsent.value = false;
  }
};

const formatPoints = (points: number): string => {
  const numberLocale = locale.value === 'de' ? 'de-DE' : 'en-US';
  return points.toLocaleString(numberLocale);
};
</script>
