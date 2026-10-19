import {
  useLogger,
  defineNuxtModule,
  addImportsDir,
  addComponentsDir,
  addComponent,
  addPlugin,
  createResolver,
} from '@nuxt/kit';
import type { Config as TailwindConfig } from 'tailwindcss/types/config';

export default defineNuxtModule({
  meta: {
    name: '@loyalista/pwa-module',
    configKey: 'loyalistaPwaModule',
  },
  defaults: {},
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const logger = useLogger('loyalista-pwa-module');
    logger.info('LoyalistaPwaModule initialized');

    /**
     * Extends Tailwind content configuration to include module runtime files.
     */
    nuxt.hook('tailwindcss:config', (config: Partial<TailwindConfig>) => {
      if (config.content && Array.isArray(config.content)) {
        config.content.push(resolve('./runtime/**/*.{vue,mjs,ts}'));
        config.content.push(resolve('./runtime/**/*.{mjs,js,ts}'));
      }
    });

    /**
     * Registers module localization files with the existing i18n module.
     */
    nuxt.hook('i18n:registerModule', (register) => {
      register({
        langDir: resolve('./runtime/lang'),
        locales: [
          {
            code: 'en',
            file: 'en.json',
          },
          {
            code: 'de',
            file: 'de.json',
          },
        ],
      });
    });

    /**
     * Registers runtime components for auto-import.
     */
    addComponentsDir({
      path: resolve('./runtime/components'),
      pattern: '**/*.vue',
      pathPrefix: false,
    });

    /**
     * Registers LoyalistaCheckout globally for dynamic module rendering.
     */
    await addComponent({
      name: 'LoyalistaCheckout',
      filePath: resolve('./runtime/components/checkout/LoyalistaCheckout.vue'),
      global: true,
      priority: 10,
    });

    /**
     * Injects LoyalistaCheckout into checkout.afterBuyButton rendering area.
     */
    addPlugin(resolve('./runtime/plugins/loyalistaCheckout.ts'));

    /**
     * Registers runtime composables for auto-import.
     */
    addImportsDir(resolve('./runtime/composables'));

    /**
     * Logs confirmation when module initialization is complete.
     */
    nuxt.hook('ready', () => {
      logger.info('Loyalista PWA module is ready');
    });
  },
});
