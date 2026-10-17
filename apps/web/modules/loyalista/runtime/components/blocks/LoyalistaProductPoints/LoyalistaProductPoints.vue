<template>
  <div
    v-if="shouldRender"
    :style="inlineStyle"
    class="loyalista-product-points"
    data-testid="loyalista-product-points"
  >
    <div
      class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 text-sm text-neutral-800 shadow-sm"
    >
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <svg class="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      </div>

      <div class="flex-1 leading-snug">
        <template v-if="loading && !totalPoints">
          <span class="text-neutral-500">{{ t('loyalista.productPoints.loading') }}</span>
        </template>
        <template v-else-if="totalPoints !== null && totalPoints > 0">
          <span class="font-medium">{{ pointsText }}</span>
          <span v-if="extraPoints > 0" class="ml-1 text-primary-800 font-semibold">
            {{ extraPointsText }}
          </span>
        </template>
        <template v-else-if="isEditMode">
          <span class="italic text-neutral-500">
            {{ t('loyalista.productPoints.editorPreview') }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { LoyalistaProductPointsProps } from './types';

const props = defineProps<LoyalistaProductPointsProps>();

const { t, locale } = useI18n();
const { isEditMode } = useEditorState();
const { registerBlockVisibility } = useBlocksVisibility();

const {
  loading,
  extraPoints,
  totalPoints,
} = useLoyalistaProductPoints();

const formattedTotalPoints = computed<string>(() => {
  if (totalPoints.value === null) return '';
  const loc = locale.value === 'de' ? 'de-DE' : 'en-US';
  return totalPoints.value.toLocaleString(loc);
});

const formattedExtraPoints = computed<string>(() => {
  if (!extraPoints.value) return '';
  const loc = locale.value === 'de' ? 'de-DE' : 'en-US';
  return extraPoints.value.toLocaleString(loc);
});

const pointsText = computed<string>(() => {
  if (totalPoints.value === 1) {
    return t('loyalista.productPoints.earnPointsSingular', { points: formattedTotalPoints.value });
  }
  return t('loyalista.productPoints.earnPoints', { points: formattedTotalPoints.value });
});

const extraPointsText = computed<string>(() => {
  if (extraPoints.value === 1) {
    return t('loyalista.productPoints.includingExtraPointsSingular', {
      extraPoints: formattedExtraPoints.value,
    });
  }
  return t('loyalista.productPoints.includingExtraPoints', {
    extraPoints: formattedExtraPoints.value,
  });
});

const shouldRender = computed<boolean>(() => {
  if (isEditMode.value) {
    return true;
  }
  if (loading.value) {
    return true;
  }
  return totalPoints.value !== null && totalPoints.value > 0;
});

const inlineStyle = computed(() => {
  const layout = props.content?.layout || {};
  return {
    paddingTop: layout.paddingTop ? `${layout.paddingTop}px` : undefined,
    paddingBottom: layout.paddingBottom ? `${layout.paddingBottom}px` : undefined,
    paddingLeft: layout.paddingLeft ? `${layout.paddingLeft}px` : undefined,
    paddingRight: layout.paddingRight ? `${layout.paddingRight}px` : undefined,
  };
});

watch(
  shouldRender,
  (visible) => {
    registerBlockVisibility(props.meta.uuid, visible);
  },
  { immediate: true },
);
</script>
