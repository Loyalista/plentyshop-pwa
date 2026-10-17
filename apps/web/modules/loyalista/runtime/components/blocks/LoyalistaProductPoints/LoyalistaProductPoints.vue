<template>
  <div
    v-if="shouldRender"
    :style="wrapperStyle"
    class="loyalista-product-points"
    data-testid="loyalista-product-points"
  >
    <div
      :class="[
        'flex items-center gap-3 rounded-lg p-3.5 text-sm text-neutral-800 transition-all',
        {
          'shadow-md @md:shadow-lg': isDropShadow,
          border: hasBorders,
        },
      ]"
      :style="cardStyle"
    >
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <svg class="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      </div>

      <div class="flex-1 leading-snug">
        <template v-if="loading && !totalPoints">
          <span class="text-neutral-500">{{ t('loyalista.productPoints.loading') }}</span>
        </template>
        <template v-else-if="renderedText">
          <span class="font-medium text-neutral-900">{{ renderedText }}</span>
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
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import type { LoyalistaProductPointsProps } from './types';

const props = defineProps<LoyalistaProductPointsProps>();

const { t } = useI18n();
const { isEditMode } = useEditorState();
const { registerBlockVisibility } = useBlocksVisibility();

const {
  loading,
  totalPoints,
  renderedText,
} = useLoyalistaProductPoints();

const shouldRender = computed<boolean>(() => {
  if (isEditMode.value) {
    return true;
  }
  if (loading.value) {
    return true;
  }
  return totalPoints.value !== null && totalPoints.value > 0 && !!renderedText.value;
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

