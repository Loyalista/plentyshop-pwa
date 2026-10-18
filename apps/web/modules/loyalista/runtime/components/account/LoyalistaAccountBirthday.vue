<template>
  <div
    v-if="hasBirthday || saveBtnLabel || birthdayHint"
    class="p-5 bg-white border border-neutral-200 rounded-lg shadow-sm"
    data-testid="loyalista-account-birthday"
  >
    <p
      v-if="birthdayHint"
      class="typography-text-sm text-neutral-700 mb-3 leading-relaxed"
      data-testid="loyalista-birthday-hint"
    >
      {{ birthdayHint }}
    </p>

    <!-- Read-only view when birthday is already saved -->
    <div v-if="hasBirthday" class="flex items-center gap-3" data-testid="loyalista-birthday-readonly">
      <input
        type="text"
        :value="customerBirthday"
        disabled
        class="w-full sm:max-w-xs px-3 py-2 text-sm bg-neutral-100 border border-neutral-300 rounded-md text-neutral-600 cursor-not-allowed select-none"
        data-testid="loyalista-birthday-readonly-input"
      />
    </div>

    <!-- Editable form when birthday is not yet registered -->
    <form v-else @submit.prevent="handleSave" class="space-y-3" data-testid="loyalista-birthday-form">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          v-model="birthdayInput"
          type="date"
          :max="todayDate"
          :min="minDate"
          :disabled="actionLoading || pendingRefetch"
          required
          class="w-full sm:w-auto px-3 py-2 text-sm border border-neutral-300 rounded-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="loyalista-birthday-input"
          @input="clearMessages"
        />

        <UiButton
          v-if="pendingRefetch"
          type="button"
          size="sm"
          :disabled="loading"
          data-testid="loyalista-birthday-retry-button"
          @click="fetchAccountData(true)"
        >
          <SfLoaderCircular v-if="loading" size="sm" class="mr-2 text-white" />
          {{ t('loyalista.account.retry') }}
        </UiButton>

        <UiButton
          v-else-if="saveBtnLabel"
          type="submit"
          size="sm"
          :disabled="!birthdayInput || actionLoading"
          data-testid="loyalista-birthday-save-button"
        >
          <SfLoaderCircular v-if="actionLoading" size="sm" class="mr-2 text-white" />
          {{ saveBtnLabel }}
        </UiButton>
      </div>

      <div
        v-if="localError"
        class="p-3 bg-negative-50 border border-negative-200 rounded text-negative-800 text-sm flex items-center gap-2"
        data-testid="loyalista-birthday-error"
      >
        <SfIconWarning class="text-negative-600 shrink-0" size="sm" />
        <span>{{ localError }}</span>
      </div>

      <div
        v-if="localSuccess"
        class="p-3 bg-positive-50 border border-positive-200 rounded text-positive-800 text-sm flex items-center gap-2"
        data-testid="loyalista-birthday-success"
      >
        <SfIconCheck class="text-positive-600 shrink-0" size="sm" />
        <span>{{ localSuccess }}</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { SfLoaderCircular, SfIconWarning, SfIconCheck } from '@storefront-ui/vue';
import { useLoyalistaAccount } from '../../composables/useLoyalistaAccount';

const { t } = useI18n();

const {
  hasBirthday,
  customerBirthday,
  birthdayHint,
  saveBtnLabel,
  saveBirthday,
  actionLoading,
  pendingRefetch,
  loading,
  fetchAccountData,
  isAuthorized,
  accountData,
} = useLoyalistaAccount();

const birthdayInput = ref('');
const localError = ref<string | null>(null);
const localSuccess = ref<string | null>(null);

/**
 * Formats a Date object using local calendar components (YYYY-MM-DD)
 * to avoid UTC/timezone offsets causing day shifts.
 */
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayDate = computed(() => formatLocalDate(new Date()));
const minDate = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return formatLocalDate(d);
});

const clearMessages = () => {
  localError.value = null;
  localSuccess.value = null;
};

// Reset local form and message state when user logs out, switches session, or account data is cleared
watch(
  [isAuthorized, accountData],
  ([authorized, data]) => {
    if (!authorized || !data) {
      birthdayInput.value = '';
      clearMessages();
    }
  },
  { immediate: true },
);

const handleSave = async () => {
  if (!birthdayInput.value || actionLoading.value || pendingRefetch.value) return;

  clearMessages();
  const res = await saveBirthday(birthdayInput.value);

  if (res.success) {
    localSuccess.value = res.message || t('loyalista.account.birthdaySuccess');
    birthdayInput.value = '';
  } else if (!res.postSuccess) {
    localError.value = res.message || t('loyalista.account.error');
  }
};
</script>
