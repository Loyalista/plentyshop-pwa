<template>
  <div class="py-2 flex flex-col">
    <span class="mb-2 text-sm text-neutral-600">
      {{ getEditorTranslation('description') }}
    </span>
    <div class="flex justify-between items-center mb-2">
      <UiFormLabel class="mb-1">{{ getEditorTranslation('label') }}</UiFormLabel>
      <SfSwitch
        v-model="isEnabled"
        data-testid="loyalista-checkout-enable-switch"
        class="checked:bg-editor-button checked:before:hover:bg-editor-button checked:border-gray-500 hover:border-gray-700 hover:before:bg-gray-700 checked:hover:bg-gray-300 checked:hover:border-gray-400"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SfSwitch } from '@storefront-ui/vue';

const { updateSetting, getBooleanSetting } = useSiteSettings('loyalistaCheckoutEnabled');

const isEnabled = computed({
  get: () => getBooleanSetting(true),
  set: (value: boolean) => updateSetting(value.toString()),
});
</script>

<i18n lang="json">
{
  "en": {
    "label": "Enable Loyalista Checkout",
    "description": "Show the Loyalista points redemption and earning widget in the checkout order summary."
  },
  "de": {
    "label": "Loyalista Checkout aktivieren",
    "description": "Das Loyalista-Widget zur Punkteeinlösung und Punkteanzeige in der Bestellübersicht des Checkouts einblenden."
  }
}
</i18n>
