/**
 * Type definitions for Loyalista checkout integration.
 */

export interface LoyalistaCheckoutTexts {
  heading?: string | null;
  registered_user?: string | null;
  no_redeem?: string | null;
  full_redeem?: string | null;
  partial_redeem?: string | null;
  unregistered_user?: string | null;
  coupon_already_applied?: string | null;
  login_required?: string | null;
  points_label?: string | null;
  btn_participate?: string | null;
  btn_apply?: string | null;
  jsActionRequiresLabel?: string | null;
  errorLoyaltyDataLoad?: string | null;
  errorOccurred?: string | null;
  errorMaxPoints?: string | null;
  errorMinPoints?: string | null;
}

export interface LoyalistaCheckoutData {
  user_registered?: boolean;
  is_logged_in?: boolean;
  total_redeemable_points?: number;
  revenue_to_point?: number | string;
  point_to_value?: number | string;
  signup_event_point?: number | string;
  partial_redemption_enabled?: boolean;
  texts?: LoyalistaCheckoutTexts;
}

export interface LoyalistaCheckoutDataResponse {
  success: boolean;
  data?: LoyalistaCheckoutData;
  message?: string;
}

export interface LoyalistaBasketTotalResponse {
  status: string;
  basket_total: number;
  order_created_points?: number;
  cat_extra_points?: number;
  item_extra_points?: number;
  total_cart_points?: string | number;
}

export interface LoyalistaRedeemResponse {
  status: 'OK' | 'ERROR' | string;
  message?: string;
  coupon?: {
    code: string;
    value: number;
  };
  couponCampaign?: {
    id: number;
    name: string;
    value: number;
    usedCodesCount: number;
  };
}

export interface LoyalistaRegisterResponse {
  success?: boolean;
  status?: string;
  message?: string;
}

export interface LoyalistaCheckoutStylingSettings {
  enabled?: boolean;
  dropShadow?: boolean;
  borders?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
}
