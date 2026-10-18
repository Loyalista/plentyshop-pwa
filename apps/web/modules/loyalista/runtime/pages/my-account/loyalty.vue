<template>
  <NuxtLayout name="default" :breadcrumbs="breadcrumbs">
    <NarrowContainer class="mb-20 px-4 @md:px-0" data-testid="loyalty-account-page">
      <h1
        class="my-4 @md:my-6 font-bold typography-headline-3 @md:typography-headline-2"
        data-testid="account-loyalty-heading"
      >
        {{ pageTitle }}
      </h1>

      <LoyalistaAccountPoints />
    </NarrowContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Locale } from '#i18n';
import LoyalistaAccountPoints from '../../components/account/LoyalistaAccountPoints.vue';
import { useLoyalistaAccount } from '../../composables/useLoyalistaAccount';

interface Breadcrumb {
  name: string;
  link: string;
}

defineI18nRoute({
  locales: process.env.LANGUAGELIST?.split(',') as Locale[],
});

/**
 * Uses layout: false with explicit <NuxtLayout name="default" :breadcrumbs="breadcrumbs">
 * to supply dynamic breadcrumbs and use the standard shop shell (header/footer)
 * without triggering the static PlentyONE account sidebar layout.
 */
definePageMeta({
  layout: false,
  pageType: 'static',
  middleware: ['auth-guard'],
});

const { t } = useI18n();
const localePath = useLocalizedPath();
const { heading } = useLoyalistaAccount();

/**
 * Prioritizes merchant-configured heading from backend widget data,
 * falling back to localized module translation when data is not yet loaded.
 */
const pageTitle = computed(() => heading.value || t('loyalista.account.heading'));

useHead({
  title: pageTitle,
});

/**
 * Two-level localized breadcrumb trail: Startseite (Home) -> Treueprogramm & Punkte (Loyalty Program & Points).
 */
const breadcrumbs = computed<Breadcrumb[]>(() => [
  {
    name: t('common.labels.home'),
    link: localePath(paths.home),
  },
  {
    name: pageTitle.value,
    link: localePath('/my-account/loyalty'),
  },
]);
</script>
