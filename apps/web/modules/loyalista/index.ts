import {
  useLogger,
  defineNuxtModule,
  addImportsDir,
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
     * Hook to modify the TailwindCSS configuration
     * Add runtime components and files to Tailwind content to enable classes
     */
    nuxt.hook('tailwindcss:config', (config: Partial<TailwindConfig>) => {
      if (config.content && Array.isArray(config.content)) {
        config.content.push(resolve('./runtime/**/*.{vue,mjs,ts}'));
        config.content.push(resolve('./runtime/**/*.{mjs,js,ts}'));
      }
    });

    /**
     * Register module-specific language files to the existing i18n module
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
     * Auto-import composables from runtime
     */
    addImportsDir(resolve('./runtime/composables'));

    /**
     * Ready hook to log a message when the module is ready
     */
    nuxt.hook('ready', () => {
      logger.info('Loyalista PWA module is ready');
    });
  },
});
