<template>
  <SiteConfigurationView>
    <template #setting-title>{{ getEditorTranslation('label') }}</template>
    <template #setting-description>
      <div class="flex flex-col px-4 text-sm">
        <p class="pb-2">
          <span class="align-middle font-bold">{{ getEditorTranslation('description') }}</span>
        </p>
      </div>
    </template>
  </SiteConfigurationView>
</template>

<script setup lang="ts"></script>

<i18n lang="json">
{
  "en": {
    "label": "Loyalista Checkout",
    "description": "Configure the display and appearance of the Loyalista loyalty points widget in the checkout order summary."
  },
  "de": {
    "label": "Loyalista Checkout",
    "description": "Konfigurieren Sie die Anzeige und das Erscheinungsbild des Loyalista-Punkteeinlösungs-Widgets in der Bestellübersicht des Checkouts."
  }
}
</i18n>
