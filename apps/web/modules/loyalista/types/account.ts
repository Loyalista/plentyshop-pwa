export interface LoyalistaAllPoints {
  valid_points?: number | string | null;
  locked_points?: number | string | null;
  expiring_in_threshold_points?: number | string | null;
  total_points?: number | string | null;
}

export interface LoyalistaCustomer {
  birthday?: string | null;
}

export interface LoyalistaAccountTexts {
  heading?: string | null;
  unregistered_offer?: string | null;
  disclaimer?: string | null;
  redeem_hint?: string | null;
  locked_hint?: string | null;
  expiry_hint?: string | null;
  join_request_hint?: string | null;
  birthday_hint?: string | null;
  points_label?: string | null;
  join_btn_label?: string | null;
  merge_btn_label?: string | null;
  btn_label?: string | null;
  save_btn_label?: string | null;
  jsRedeemablePoints?: string | null;
  jsLockedPoints?: string | null;
  jsExpiringPoints?: string | null;
  errorLoyaltyDataLoad?: string | null;
  errorNoData?: string | null;
  errorEnterBirthday?: string | null;
  successBirthdaySaved?: string | null;
  errorBirthdaySave?: string | null;
  errorOccurred?: string | null;
}

export interface LoyalistaAccountDataResponse {
  user_registered: boolean;
  customer?: LoyalistaCustomer | null;
  all_points?: LoyalistaAllPoints | null;
  points?: number | string | null;
  point_to_conversion?: number | string | null;
  revenue_to_point?: number | string | null;
  point_to_value?: number | string | null;
  expiry_period?: number | string | null;
  expiry_days_threshold?: number | string | null;
  signup_points?: number | string | null;
  birthday_points?: number | string | null;
  texts?: LoyalistaAccountTexts | null;
}

export interface LoyalistaAccountApiResponse {
  success: boolean;
  status?: string;
  data?: LoyalistaAccountDataResponse;
  message?: string;
}
