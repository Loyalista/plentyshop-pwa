# LoyalistaPwaModule

Loyalista frontend module for the PlentyONE PWA Shop.

## Overview

- **Product:** Loyalista PWA Module
- **Purpose:** Frontend integration for PlentyONE PWA Shop
- **Architecture:** Nuxt 3 module based on the official PlentyONE PWA Module Boilerplate
- **Repository:** Independent Loyalista repository (`Loyalista/LoyalistaPwaModule`)

## Architecture & Components

The module integrates with PlentyONE PWA through configurable Shop-Editor content blocks and session-bound REST endpoints:

- **`LoyalistaAccount`**: Configurable Shop-Editor content block for storefront customer loyalty accounts. Features points balance overview (redeemable, locked, expiring), program opt-in and opt-out, birthday bonus management, and account merge requests. The content page and customer access requirements (such as "Login required") are configured by the merchant directly in the PlentyONE Shop-Editor.
- **`LoyalistaProductPoints`**: Configurable Shop-Editor content block displaying calculated base and category/product extra points on product detail pages.
- **`useLoyalistaAccount`**: Composable managing customer loyalty data fetching, session changes, and account mutations via `/rest/loyalista/` endpoints.
- **`useLoyalistaProductPoints`**: Composable for product detail page points calculation and localized merchant text formatting.

## Origin / Source

- **Upstream Boilerplate:** [plentymarkets/pwa-module-boilerplate](https://github.com/plentymarkets/pwa-module-boilerplate)
- **Based on commit:** `5e857acb61f01f2f446b371b3f34dc0382b56c45` (2025-07-01)
