# LoyalistaPwaModule

Loyalista frontend module for the PlentyONE PWA Shop.

## Overview

- **Product:** Loyalista PWA Module
- **Purpose:** Storefront loyalty program integration for PlentyONE PWA
- **Architecture:** Nuxt 3 module adhering to the official PlentyONE PWA extensibility architecture
- **Repository:** Independent Loyalista repository (`Loyalista/LoyalistaPwaModule`)

## Architecture & Integration

The module integrates seamlessly with the PlentyONE PWA storefront through configurable Shop-Editor content blocks, dynamic module rendering injection, Site Settings, and session-bound REST endpoints:

### 1. Checkout Integration (`LoyalistaCheckout`)

- **Component:** `LoyalistaCheckout` provides a comprehensive loyalty points redemption interface within the checkout order summary.
- **Injection Point:** Automatically registered into the official `checkout.afterBuyButton` rendering area via `useModuleRendering`. No manual block placement on the checkout page is required.
- **Supported Workflows:**
  - Guest visitor notice with login link redirecting back to the checkout.
  - Unregistered customer opt-in checkbox and instant loyalty registration.
  - Current points balance display and potential points earned from the active cart.
  - Full points redemption (one-click) and partial points redemption (custom integer input).
  - Validation against customer balance and maximum redeemable basket value.
  - Active coupon detection disabling further loyalty redemption while an existing coupon is applied.
- **Site Settings (`Checkout -> Loyalista Checkout`):**
  - Global activation toggle (`loyalistaCheckoutEnabled`).
  - Styling controls: drop shadow, borders, border colour, background colour, and four-directional padding (px).
- **Data Flow & Backend Logic:**
  - Operates directly against native PlentyONE cart state (`useCart`) and session getters (`cartGetters`).
  - All business logic, campaign lookups, and validation thresholds reside authoritatively in the Loyalista backend plugin (`/rest/loyalista/` endpoints).

### 2. Storefront Account Block (`LoyalistaAccount`)

- Configurable Shop-Editor content block for dedicated loyalty customer pages.
- Displays redeemable, locked, and expiring points.
- Provides customer actions: program opt-in, opt-out, birthday bonus registration, and account merge requests.

### 3. Product Detail Page Points (`LoyalistaProductPoints`)

- Configurable Shop-Editor content block displaying calculated base and category/item extra loyalty points on product detail pages.

### 4. Composables

- **`useLoyalistaCheckout`**: Manages checkout point calculations, redemption mutation locking, basket total synchronisation, and localized token replacement.
- **`useLoyalistaAccount`**: Manages customer loyalty data retrieval, session transitions, and account mutations.
- **`useLoyalistaProductPoints`**: Computes earnable points on product detail pages based on pricing and configuration.

## Coupon Lifecycle & Redemption Workflow

Points redemption in the checkout follows a transaction-safe five-step workflow:

1. **Redemption Request:** The customer initiates a redemption in `LoyalistaCheckout`. A POST request is dispatched to `/rest/loyalista/checkout/redeem-points/`.
2. **Backend Coupon Creation:** The Loyalista backend validates the requested points against customer balance and basket totals, provisions a dedicated PlentyONE coupon within the configured campaign, and reserves the points via the Loyalista API.
3. **Basket Assignment:** The backend applies the generated coupon code directly to the PlentyONE shopping cart (`$basketRepo->setCouponCode(...)`).
4. **Session & Cart Synchronisation:** Upon successful response (`status: 'OK'`), the module triggers `useFetchSession().fetchSession()`, updating the native reactive `useCart` store with the applied coupon, discount amount, and revised order totals.
5. **Loyalty State Refresh:** Checkout loyalty data and basket points are refetched to display the updated point balance and lock subsequent redemption attempts.

### Coupon Removal & Reversion

Coupons applied to the cart can be removed at any time through the native PlentyONE coupon interface. Points associated with removed or unpurchased coupons are reconciled and returned to the customer account asynchronously via the backend `RevertRedeemCron`.

## Known Platform Behavior (PlentyONE PWA `Coupon.vue`)

In the tested version of PlentyShop PWA, the native `Coupon.vue` component initializes its local `couponCode` display reference during `onMounted`. Consequently:

- When a coupon is applied externally (such as via the Loyalista checkout redemption endpoint), the coupon discount amount and adjusted cart totals update immediately across the order summary (`OrderSummary.vue`).
- The textual coupon code inside `Coupon.vue` becomes visible upon the next component mount (e.g. following a page reload or navigation).
- This behavior is specific to the local state management of `Coupon.vue` in the currently evaluated PlentyONE PWA version. It does not affect points deduction accuracy, discount calculation, or successful order completion.
- In accordance with architectural boundaries, no shop-core overrides or custom coupon management replacements are implemented in this module. This behavior is documented for upstream submission to PlentyONE.

## Origin & Upstream

- **Upstream Boilerplate:** [plentymarkets/pwa-module-boilerplate](https://github.com/plentymarkets/pwa-module-boilerplate)
- **Base Commit:** `5e857acb61f01f2f446b371b3f34dc0382b56c45` (2025-07-01)
