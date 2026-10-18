<template>
  <UiDivider class="col-span-3 -mx-4 !w-auto @md:mx-0" />
  <h2
    class="hidden @md:block col-span-3 typography-headline-4 font-bold mx-4 capitalize"
    data-testid="account-loyalty-heading"
  >
    {{ heading || t('loyalista.account.heading') }}
  </h2>
  <div class="col-span-3 mx-4 @md:mx-0">
    <LoyalistaAccountPoints />
  </div>
</template>

<script setup lang="ts">
import type { Locale } from '#i18n';
import LoyalistaAccountPoints from '../../components/account/LoyalistaAccountPoints.vue';
import { useLoyalistaAccount } from '../../composables/useLoyalistaAccount';

defineI18nRoute({
  locales: process.env.LANGUAGELIST?.split(',') as Locale[],
});

definePageMeta({
  layout: 'account',
  pageType: 'static',
  middleware: ['auth-guard'],
});

const { t } = useI18n();
const { heading } = useLoyalistaAccount();
</script>
