<template>
  <div class="py-2 flex flex-col space-y-4">
    <span class="text-sm text-neutral-600">
      {{ getEditorTranslation('description') }}
    </span>

    <!-- Drop Shadow -->
    <div class="flex items-center justify-between py-2 border-b border-neutral-100">
      <UiFormLabel>{{ getEditorTranslation('drop-shadow-label') }}</UiFormLabel>
      <SfSwitch
        v-model="dropShadow"
        data-testid="loyalista-checkout-drop-shadow"
        class="checked:bg-editor-button checked:before:hover:bg-editor-button checked:border-gray-500 hover:border-gray-700 hover:before:bg-gray-700 checked:hover:bg-gray-300 checked:hover:border-gray-400"
      />
    </div>

    <!-- Borders -->
    <div class="flex items-center justify-between py-2 border-b border-neutral-100">
      <UiFormLabel>{{ getEditorTranslation('borders-label') }}</UiFormLabel>
      <SfSwitch
        v-model="borders"
        data-testid="loyalista-checkout-borders"
        class="checked:bg-editor-button checked:before:hover:bg-editor-button checked:border-gray-500 hover:border-gray-700 hover:before:bg-gray-700 checked:hover:bg-gray-300 checked:hover:border-gray-400"
      />
    </div>

    <!-- Border Color -->
    <div v-if="borders" class="py-2 border-b border-neutral-100">
      <UiFormLabel class="mb-2 block">{{ getEditorTranslation('border-color-label') }}</UiFormLabel>
      <EditorColorPicker v-model="borderColor" class="w-full">
        <template #trigger="{ color, toggle }">
          <SfInput v-model="borderColor" data-testid="loyalista-checkout-border-color" type="text">
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

    <!-- Background Color -->
    <div class="py-2 border-b border-neutral-100">
      <UiFormLabel class="mb-2 block">{{ getEditorTranslation('background-color-label') }}</UiFormLabel>
      <EditorColorPicker v-model="backgroundColor" class="w-full">
        <template #trigger="{ color, toggle }">
          <SfInput v-model="backgroundColor" data-testid="loyalista-checkout-background-color" type="text">
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

    <!-- Padding -->
    <div class="py-2">
      <UiFormLabel class="mb-2 block">{{ getEditorTranslation('padding-label') }}</UiFormLabel>
      <div class="grid grid-cols-4 gap-px rounded-md overflow-hidden border border-gray-300">
        <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white border-r border-gray-200">
          <span><SfIconArrowUpward size="sm" /></span>
          <input
            v-model.number="paddingTop"
            type="number"
            class="w-12 text-center outline-none text-sm"
            data-testid="loyalista-checkout-padding-top"
            aria-label="Top padding"
          />
        </div>

        <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white border-r border-gray-200">
          <span><SfIconArrowDownward size="sm" /></span>
          <input
            v-model.number="paddingBottom"
            type="number"
            class="w-12 text-center outline-none text-sm"
            data-testid="loyalista-checkout-padding-bottom"
            aria-label="Bottom padding"
          />
        </div>

        <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white border-r border-gray-200">
          <span><SfIconArrowBack size="sm" /></span>
          <input
            v-model.number="paddingLeft"
            type="number"
            class="w-12 text-center outline-none text-sm"
            data-testid="loyalista-checkout-padding-left"
            aria-label="Left padding"
          />
        </div>

        <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white">
          <span><SfIconArrowForward size="sm" /></span>
          <input
            v-model.number="paddingRight"
            type="number"
            class="w-12 text-center outline-none text-sm"
            data-testid="loyalista-checkout-padding-right"
            aria-label="Right padding"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  SfSwitch,
  SfInput,
  SfIconArrowUpward,
  SfIconArrowDownward,
  SfIconArrowBack,
  SfIconArrowForward,
} from '@storefront-ui/vue';

const { updateSetting: updateDropShadow, getBooleanSetting: getDropShadow } =
  useSiteSettings('loyalistaCheckoutDropShadow');
const { updateSetting: updateBorders, getBooleanSetting: getBorders } =
  useSiteSettings('loyalistaCheckoutBorders');
const { updateSetting: updateBorderColor, getSetting: getBorderColor } =
  useSiteSettings('loyalistaCheckoutBorderColor');
const { updateSetting: updateBackgroundColor, getSetting: getBackgroundColor } =
  useSiteSettings('loyalistaCheckoutBackgroundColor');
const { updateSetting: updatePaddingTop, getNumberSetting: getPaddingTop } =
  useSiteSettings('loyalistaCheckoutPaddingTop');
const { updateSetting: updatePaddingBottom, getNumberSetting: getPaddingBottom } =
  useSiteSettings('loyalistaCheckoutPaddingBottom');
const { updateSetting: updatePaddingLeft, getNumberSetting: getPaddingLeft } =
  useSiteSettings('loyalistaCheckoutPaddingLeft');
const { updateSetting: updatePaddingRight, getNumberSetting: getPaddingRight } =
  useSiteSettings('loyalistaCheckoutPaddingRight');

const dropShadow = computed({
  get: () => getDropShadow(true),
  set: (val: boolean) => updateDropShadow(val.toString()),
});

const borders = computed({
  get: () => getBorders(true),
  set: (val: boolean) => updateBorders(val.toString()),
});

const borderColor = computed({
  get: () => getBorderColor() || '#E5E7EB',
  set: (val: string) => updateBorderColor(val),
});

const backgroundColor = computed({
  get: () => getBackgroundColor() || '#FFFFFF',
  set: (val: string) => updateBackgroundColor(val),
});

const paddingTop = computed({
  get: () => getPaddingTop(0),
  set: (val: number) => updatePaddingTop(String(val || 0)),
});

const paddingBottom = computed({
  get: () => getPaddingBottom(0),
  set: (val: number) => updatePaddingBottom(String(val || 0)),
});

const paddingLeft = computed({
  get: () => getPaddingLeft(0),
  set: (val: number) => updatePaddingLeft(String(val || 0)),
});

const paddingRight = computed({
  get: () => getPaddingRight(0),
  set: (val: number) => updatePaddingRight(String(val || 0)),
});
</script>

<i18n lang="json">
{
  "en": {
    "description": "Customize the styling and spacing of the Loyalista checkout widget.",
    "drop-shadow-label": "Drop shadow",
    "borders-label": "Borders",
    "border-color-label": "Border colour",
    "background-color-label": "Background colour",
    "padding-label": "Padding (px)"
  },
  "de": {
    "description": "Passen Sie das Styling und die Innenabstände des Loyalista-Checkout-Widgets an.",
    "drop-shadow-label": "Schatten",
    "borders-label": "Rahmen",
    "border-color-label": "Rahmenfarbe",
    "background-color-label": "Hintergrundfarbe",
    "padding-label": "Innenabstand (px)"
  }
}
</i18n>
