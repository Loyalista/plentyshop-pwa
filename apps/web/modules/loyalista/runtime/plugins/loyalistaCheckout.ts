export default defineNuxtPlugin(() => {
  const { addComponent } = useModuleRendering('checkout.afterBuyButton');
  addComponent('LoyalistaCheckout');
});
