<template>
  <div>
    <EditorFormPanel
      v-model="textSettings"
      :title="getEditorTranslation('text-settings-label')"
      data-testid="loyalista-text-settings"
    >
      <div class="py-2">
        <div class="flex justify-between mb-2">
          <UiFormLabel>{{ getEditorTranslation('title-label') }}</UiFormLabel>
        </div>
        <label>
          <SfInput v-model="blockContent.text.title" type="text" data-testid="input-loyalista-title" />
        </label>
      </div>
    </EditorFormPanel>

    <EditorFormPanel
      v-model="layoutSettings"
      :title="getEditorTranslation('layout-settings-label')"
      data-testid="loyalista-layout-settings"
    >
      <EditorFullWidthToggle v-model="isFullWidth" :block-uuid="blockUuid" />
      <div class="mt-5">
        {{ getEditorTranslation('padding') }}
      </div>
      <div>
        <div class="grid grid-cols-4 gap-px rounded-md overflow-hidden border border-gray-300">
          <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white border-r">
            <span><SfIconArrowUpward /></span>
            <input
              v-model.number="blockContent.layout.paddingTop"
              type="number"
              class="w-12 text-center outline-none"
              data-testid="loyalista-padding-top"
            />
          </div>

          <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white border-r">
            <span><SfIconArrowDownward /></span>
            <input
              v-model.number="blockContent.layout.paddingBottom"
              type="number"
              class="w-12 text-center outline-none"
              data-testid="loyalista-padding-bottom"
            />
          </div>

          <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white border-r">
            <span><SfIconArrowBack /></span>
            <input
              v-model.number="blockContent.layout.paddingLeft"
              type="number"
              class="w-12 text-center outline-none"
              data-testid="loyalista-padding-left"
            />
          </div>

          <div class="flex items-center justify-center gap-1 px-2 py-1 bg-white">
            <span><SfIconArrowForward /></span>
            <input
              v-model.number="blockContent.layout.paddingRight"
              type="number"
              class="w-12 text-center outline-none"
              data-testid="loyalista-padding-right"
            />
          </div>
        </div>
      </div>
    </EditorFormPanel>
  </div>
</template>

<script setup lang="ts">
import {
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

const textSettings = ref(true);
const layoutSettings = ref(true);

const blockContent = computed<Required<LoyalistaProductPointsContent>>(() => {
  const rawContent = findOrDeleteBlockByUuid(data.value, props.uuid || blockUuid.value)?.content ?? {};
  const content = rawContent as Partial<LoyalistaProductPointsContent>;
  if (!content.text) {
    content.text = { title: 'Loyalista' };
  }
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
    "title-label": "Title",
    "text-settings-label": "Text Settings",
    "layout-settings-label": "Layout Settings",
    "padding": "Padding"
  },
  "de": {
    "title-label": "Titel",
    "text-settings-label": "Texteinstellungen",
    "layout-settings-label": "Layout-Einstellungen",
    "padding": "Innenabstand (Padding)"
  }
}
</i18n>
