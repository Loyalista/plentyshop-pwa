/**
 * Registers the LoyalistaCheckout component into the native PlentyONE PWA
 * checkout order summary via the ModuleComponentRendering injection point.
 */
export default defineNuxtPlugin(() => {
  const { addComponent } = useModuleRendering('checkout.afterBuyButton');
  addComponent('LoyalistaCheckout');
});
