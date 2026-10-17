<template>
  <div>
    <EditorFormPanel
      v-model="layoutSettings"
      :title="getEditorTranslation('layout-settings-label')"
      data-testid="loyalista-layout-settings"
    >
      <div class="flex items-center justify-between py-4">
        <UiFormLabel>{{ getEditorTranslation('drop-shadow-label') }}</UiFormLabel>
        <SfSwitch v-model="blockContent.dropShadow" data-testid="loyalista-drop-shadow" />
      </div>

      <div class="flex items-center justify-between py-4">
        <UiFormLabel>{{ getEditorTranslation('borders-label') }}</UiFormLabel>
        <SfSwitch v-model="blockContent.borders" data-testid="loyalista-borders" />
      </div>

      <div v-if="blockContent.borders" class="py-4">
        <UiFormLabel class="mb-2 block">{{ getEditorTranslation('border-color-label') }}</UiFormLabel>
        <EditorColorPicker v-model="blockContent.borderColor" class="w-full">
          <template #trigger="{ color, toggle }">
            <SfInput v-model="blockContent.borderColor" data-testid="loyalista-border-color" type="text">
              <template #suffix>
                <button
                  :style="{ backgroundColor: color }"
                  class="border border-[#a0a0a0] rounded-lg cursor-pointer w-10 h-8"
                  type="button"
                  aria-label="Border color picker button"
                  @mousedown.stop
                  @click.stop="toggle"
                />
              </template>
            </SfInput>
          </template>
        </EditorColorPicker>
      </div>

      <div class="py-4">
        <UiFormLabel class="mb-2 block">{{ getEditorTranslation('background-color-label') }}</UiFormLabel>
        <EditorColorPicker v-model="blockContent.backgroundColor" class="w-full">
          <template #trigger="{ color, toggle }">
            <SfInput v-model="blockContent.backgroundColor" data-testid="loyalista-background-color" type="text">
              <template #suffix>
                <button
                  :style="{ backgroundColor: color }"
                  class="border border-[#a0a0a0] rounded-lg cursor-pointer w-10 h-8"
                  type="button"
                  aria-label="Background color picker button"
                  @mousedown.stop
                  @click.stop="toggle"
                />
              </template>
            </SfInput>
          </template>
        </EditorColorPicker>
      </div>

      <EditorFullWidthToggle v-model="isFullWidth" :block-uuid="blockUuid" />

      <div class="py-2">
        <UiFormLabel>{{ getEditorTranslation('padding-label') }}</UiFormLabel>
        <div class="grid grid-cols-4 gap-px rounded-md overflow-hidden border border-gray-300">
          <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white border-r">
            <span><SfIconArrowUpward /></span>
            <input
              v-model.number="blockContent.layout.paddingTop"
              type="number"
              class="w-12 text-center outline-none"
              data-testid="loyalista-padding-top"
              aria-label="Top padding"
            />
          </div>

          <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white border-r">
            <span><SfIconArrowDownward /></span>
            <input
              v-model.number="blockContent.layout.paddingBottom"
              type="number"
              class="w-12 text-center outline-none"
              data-testid="loyalista-padding-bottom"
              aria-label="Bottom padding"
            />
          </div>

          <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white border-r">
            <span><SfIconArrowBack /></span>
            <input
              v-model.number="blockContent.layout.paddingLeft"
              type="number"
              class="w-12 text-center outline-none"
              data-testid="loyalista-padding-left"
              aria-label="Left padding"
            />
          </div>

          <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white">
            <span><SfIconArrowForward /></span>
            <input
              v-model.number="blockContent.layout.paddingRight"
              type="number"
              class="w-12 text-center outline-none"
              data-testid="loyalista-padding-right"
              aria-label="Right padding"
            />
          </div>
        </div>
        <div class="px-4 py-3">
          <span class="typography-text-xs text-neutral-700">
            {{ getEditorTranslation('spacing-around') }}
          </span>
        </div>
      </div>
    </EditorFormPanel>
  </div>
</template>

<script setup lang="ts">
import {
  SfSwitch,
  SfInput,
  SfIconArrowUpward,
  SfIconArrowDownward,
  SfIconArrowBack,
  SfIconArrowForward,
} from '@storefront-ui/vue';
import type { LoyalistaProductPointsFormProps, LoyalistaProductPointsContent } from './types';

const props = defineProps<LoyalistaProductPointsFormProps>();

const { allBlocks: data } = useBlocks();
const { blockUuid } = useSiteConfiguration();
const { findOrDeleteBlockByUuid } = useBlockManager();

const layoutSettings = ref(true);

const blockContent = computed<Required<LoyalistaProductPointsContent>>(() => {
  const rawContent = findOrDeleteBlockByUuid(data.value, props.uuid || blockUuid.value)?.content ?? {};
  const content = rawContent as Partial<LoyalistaProductPointsContent>;
  if (content.dropShadow === undefined) content.dropShadow = true;
  if (content.borders === undefined) content.borders = true;
  if (content.borderColor === undefined) content.borderColor = '#E5E7EB';
  if (content.backgroundColor === undefined) content.backgroundColor = '#F9FAFB';
  if (!content.layout) {
    content.layout = {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      fullWidth: false,
    };
  }
  return content as Required<LoyalistaProductPointsContent>;
});

const { isFullWidth } = useFullWidthToggleForContent(blockContent);
</script>

<i18n lang="json">
{
  "en": {
    "layout-settings-label": "Layout Settings",
    "drop-shadow-label": "Drop shadow",
    "borders-label": "Borders",
    "border-color-label": "Border color",
    "background-color-label": "Background color",
    "padding-label": "Padding",
    "spacing-around": "Spacing around the elements"
  },
  "de": {
    "layout-settings-label": "Layout-Einstellungen",
    "drop-shadow-label": "Schattenwurf",
    "borders-label": "Rahmen",
    "border-color-label": "Rahmenfarbe",
    "background-color-label": "Hintergrundfarbe",
    "padding-label": "Innenabstand (Padding)",
    "spacing-around": "Abstand um die Elemente"
  }
}
</i18n>
