<template>
  <div
    v-if="mergeBtnLabel"
    class="p-5 bg-white border border-neutral-200 rounded-lg shadow-sm"
    data-testid="loyalista-account-merge"
  >
    <p
      v-if="joinRequestHint"
      class="typography-text-sm text-neutral-700 mb-3 leading-relaxed"
      data-testid="loyalista-merge-hint"
    >
      {{ joinRequestHint }}
    </p>

    <form @submit.prevent="handleMerge" class="space-y-3" data-testid="loyalista-merge-form">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          v-model="emailInput"
          type="email"
          maxlength="254"
          :placeholder="t('loyalista.account.emailPlaceholder')"
          :disabled="actionLoading || pendingRefetch"
          required
          class="w-full sm:max-w-md px-3 py-2 text-sm border border-neutral-300 rounded-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="loyalista-merge-input"
          @input="clearMessages"
        />

        <button
          v-if="pendingRefetch"
          type="button"
          :disabled="loading"
          class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="loyalista-merge-retry-button"
          @click="fetchAccountData(true)"
        >
          <SfLoaderCircular v-if="loading" size="sm" class="mr-2 text-white" />
          {{ t('loyalista.account.retry') }}
        </button>

        <button
          v-else
          type="submit"
          :disabled="!emailInput.trim() || actionLoading"
          class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="loyalista-merge-button"
        >
          <SfLoaderCircular v-if="actionLoading" size="sm" class="mr-2 text-white" />
          {{ mergeBtnLabel }}
        </button>
      </div>

      <div
        v-if="localError"
        class="p-3 bg-negative-50 border border-negative-200 rounded text-negative-800 text-sm flex items-center gap-2"
        data-testid="loyalista-merge-error"
      >
        <SfIconWarning class="text-negative-600 shrink-0" size="sm" />
        <span>{{ localError }}</span>
      </div>

      <div
        v-if="localSuccess"
        class="p-3 bg-positive-50 border border-positive-200 rounded text-positive-800 text-sm flex items-center gap-2"
        data-testid="loyalista-merge-success"
      >
        <SfIconCheck class="text-positive-600 shrink-0" size="sm" />
        <span>{{ localSuccess }}</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { SfLoaderCircular, SfIconWarning, SfIconCheck } from '@storefront-ui/vue';
import { useLoyalistaAccount } from '../../composables/useLoyalistaAccount';

const { t } = useI18n();

const {
  joinRequestHint,
  mergeBtnLabel,
  mergeCustomer,
  actionLoading,
  pendingRefetch,
  loading,
  fetchAccountData,
  isAuthorized,
  accountData,
} = useLoyalistaAccount();

const emailInput = ref('');
const localError = ref<string | null>(null);
const localSuccess = ref<string | null>(null);

const clearMessages = () => {
  localError.value = null;
  localSuccess.value = null;
};

// Reset local form and message state when user logs out, switches session, or account data is cleared
watch(
  [isAuthorized, accountData],
  ([authorized, data]) => {
    if (!authorized || !data) {
      emailInput.value = '';
      clearMessages();
    }
  },
  { immediate: true },
);

const handleMerge = async () => {
  const trimmed = emailInput.value.trim();
  if (!trimmed || actionLoading.value || pendingRefetch.value) return;

  clearMessages();
  const res = await mergeCustomer(trimmed);

  if (res.success) {
    localSuccess.value = res.message || t('loyalista.account.mergeSuccess');
    emailInput.value = '';
  } else if (!res.postSuccess) {
    localError.value = res.message || t('loyalista.account.error');
  }
};
</script>
