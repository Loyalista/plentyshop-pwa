<template>
  <div class="loyalista-account-points" data-testid="loyalista-account-points">
    <div
      v-if="loading && !accountData"
      class="flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-600 my-4"
      data-testid="loyalista-account-loading"
    >
      <SfLoaderCircular size="lg" class="mb-4 text-primary-600" />
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
          <button
            type="button"
            class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-md transition-colors"
            data-testid="loyalista-account-retry-button"
            @click="fetchAccountData(true)"
          >
            {{ t('loyalista.account.retry') }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="isRegistered"
      class="space-y-6 my-4"
      data-testid="loyalista-account-registered"
    >
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
    </div>

    <div
      v-else-if="accountData && !isRegistered"
      class="p-6 bg-white border border-neutral-200 rounded-lg shadow-sm my-4"
      data-testid="loyalista-account-unregistered"
    >
      <div v-if="unregisteredOffer" class="typography-text-base text-neutral-800 leading-relaxed" data-testid="loyalista-unregistered-offer">
        {{ unregisteredOffer }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SfLoaderCircular, SfIconWarning } from '@storefront-ui/vue';
import { useLoyalistaAccount } from '../../composables/useLoyalistaAccount';

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
} = useLoyalistaAccount();

const formatPoints = (points: number): string => {
  const numberLocale = locale.value === 'de' ? 'de-DE' : 'en-US';
  return points.toLocaleString(numberLocale);
};
</script>
