<template>
  <div
    v-if="shouldRender"
    :style="wrapperStyle"
    class="loyalista-account-block"
    data-testid="loyalista-account-block"
  >
    <div
      :class="[
        'rounded-lg p-4 @md:p-6 text-neutral-800 transition-all',
        {
          'shadow-md @md:shadow-lg': isDropShadow,
          border: hasBorders,
        },
      ]"
      :style="cardStyle"
    >
      <!-- Guest view when not authorized and not in edit preview -->
      <div
        v-if="!isAuthorized && !isEditMode"
        class="flex flex-col items-center justify-center p-6 text-center"
        data-testid="loyalista-account-guest"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 mb-4">
          <svg class="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <h2 class="typography-headline-4 font-bold text-neutral-900 mb-2">
          {{ t('loyalista.account.guestHeading') }}
        </h2>
        <p class="typography-text-sm text-neutral-600 max-w-md mb-6 leading-relaxed">
          {{ t('loyalista.account.guestDescription') }}
        </p>
        <UiButton
          :tag="NuxtLink"
          :to="{ path: localePath(paths.authLogin), query: { redirect: currentRoutePath } }"
          variant="primary"
          data-testid="loyalista-account-guest-login-btn"
        >
          {{ t('loyalista.account.login') }}
        </UiButton>
      </div>

      <!-- Full account view for authorized customers or editor preview -->
      <div v-else>
        <div
          v-if="isEditMode"
          class="mb-4 p-2.5 bg-neutral-100 border border-neutral-300 rounded text-xs text-neutral-600 flex items-center gap-2"
          data-testid="loyalista-account-editor-notice"
        >
          <SfIconInfo class="shrink-0 text-primary-600" size="sm" />
          <span>{{ t('loyalista.account.editorPreviewNotice') }}</span>
        </div>
        <LoyalistaAccountPoints />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, resolveComponent } from 'vue';
import { SfIconInfo } from '@storefront-ui/vue';
import type { LoyalistaAccountProps } from './types';
import LoyalistaAccountPoints from '../../account/LoyalistaAccountPoints.vue';

const props = defineProps<LoyalistaAccountProps>();

const { t } = useI18n();
const localePath = useLocalizedPath();
const route = useRoute();
const NuxtLink = resolveComponent('NuxtLink');

const { isAuthorized } = useCustomer();
const { isEditMode } = useEditorState();
const { registerBlockVisibility } = useBlocksVisibility();

const currentRoutePath = computed(() => route.fullPath);

const shouldRender = computed<boolean>(() => {
  return true;
});

const isDropShadow = computed<boolean>(() => props.content?.dropShadow ?? true);
const hasBorders = computed<boolean>(() => props.content?.borders ?? true);

const cardStyle = computed(() => {
  const style: Record<string, string | undefined> = {};
  if (hasBorders.value && props.content?.borderColor) {
    style.borderColor = props.content.borderColor;
  }
  if (props.content?.backgroundColor) {
    style.backgroundColor = props.content.backgroundColor;
  }
  return style;
});

const wrapperStyle = computed(() => {
  const layout = props.content?.layout || {};
  return {
    paddingTop: layout.paddingTop !== undefined ? `${layout.paddingTop}px` : undefined,
    paddingBottom: layout.paddingBottom !== undefined ? `${layout.paddingBottom}px` : undefined,
    paddingLeft: layout.paddingLeft !== undefined ? `${layout.paddingLeft}px` : undefined,
    paddingRight: layout.paddingRight !== undefined ? `${layout.paddingRight}px` : undefined,
  };
});

if (import.meta.client) {
  watch(
    shouldRender,
    (visible) => {
      registerBlockVisibility(props.meta.uuid, visible);
    },
    { immediate: false },
  );

  onMounted(() => {
    registerBlockVisibility(props.meta.uuid, shouldRender.value);
  });

  onBeforeUnmount(() => {
    registerBlockVisibility(props.meta.uuid, false);
  });
}
</script>
