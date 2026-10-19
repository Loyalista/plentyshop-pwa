import { describe, it, expect } from 'vitest';
import { replaceLoyalistaCheckoutTokens, calculateMaxPointsByBasket } from '../useLoyalistaCheckout';

describe('replaceLoyalistaCheckoutTokens', () => {
  it('returns empty string when template is empty or undefined', () => {
    expect(replaceLoyalistaCheckoutTokens('', {})).toBe('');
    expect(replaceLoyalistaCheckoutTokens(null as unknown as string, {})).toBe('');
  });

  it('replaces [account_balance] with formatted point balance', () => {
    const template = 'Aktueller Punktestand: [account_balance] [points_label]';
    const result = replaceLoyalistaCheckoutTokens(
      template,
      { accountBalance: 1250, pointsLabel: 'Punkte' },
      'de-DE',
    );
    expect(result).toBe('Aktueller Punktestand: 1.250 Punkte');
  });

  it('replaces [value_of_account_balance] and [discount_amount] with formatted currency amounts', () => {
    const template = 'Löse [account_balance] ein und spare [value_of_account_balance] € ([discount_amount])';
    const result = replaceLoyalistaCheckoutTokens(
      template,
      {
        accountBalance: 500,
        valueOfAccountBalance: 5.0,
        discountAmount: 5.0,
      },
      'de-DE',
    );
    expect(result).toContain('5,00');
  });

  it('replaces [number_of_points_shopping_cart] and [points_for_order] with order earning points', () => {
    const template = 'Erhalt: [number_of_points_shopping_cart] Punkte für diese Bestellung ([points_for_order])';
    const result = replaceLoyalistaCheckoutTokens(
      template,
      {
        pointsForOrder: 75,
      },
      'de-DE',
    );
    expect(result).toBe('Erhalt: 75 Punkte für diese Bestellung (75)');
  });

  it('replaces [points_for_signup] for unregistered customer teaser', () => {
    const template = 'Sichern Sie sich [points_for_signup] Willkommenspunkte!';
    const result = replaceLoyalistaCheckoutTokens(
      template,
      {
        pointsForSignup: 200,
      },
      'de-DE',
    );
    expect(result).toBe('Sichern Sie sich 200 Willkommenspunkte!');
  });

  it('handles en-US locale formatting correctly', () => {
    const template = 'Balance: [account_balance] [points_label] worth [value_of_account_balance]';
    const result = replaceLoyalistaCheckoutTokens(
      template,
      {
        accountBalance: 2500,
        valueOfAccountBalance: 25.0,
        pointsLabel: 'Points',
      },
      'en-US',
    );
    expect(result).toBe('Balance: 2,500 Points worth 25.00');
  });

  it('gracefully handles missing replacement parameters with safe defaults', () => {
    const template = '[account_balance] [points_label] [value_of_account_balance] [points_for_order]';
    const result = replaceLoyalistaCheckoutTokens(template, {}, 'de-DE');
    expect(result).toBe('0  0,00 0');
  });

  it('replaces [points_label] in the no-redeem option template with merchant configured label', () => {
    const template = 'Weiter sammeln und keine [points_label] einlösen.';
    const result = replaceLoyalistaCheckoutTokens(
      template,
      { pointsLabel: 'Testpunkte' },
      'de-DE',
    );
    expect(result).toBe('Weiter sammeln und keine Testpunkte einlösen.');
  });

  it('replaces [points_label] in English no-redeem option template', () => {
    const template = "Keep collecting and don't redeem [points_label].";
    const result = replaceLoyalistaCheckoutTokens(
      template,
      { pointsLabel: 'Points' },
      'en-US',
    );
    expect(result).toBe("Keep collecting and don't redeem Points.");
  });

  it('replaces [points_label] case-insensitively with dynamic merchant labels', () => {
    const templateUpper = 'Option: [POINTS_LABEL]';
    const templateMixed = 'Option: [Points_Label]';
    expect(replaceLoyalistaCheckoutTokens(templateUpper, { pointsLabel: 'Treueherzen' })).toBe('Option: Treueherzen');
    expect(replaceLoyalistaCheckoutTokens(templateMixed, { pointsLabel: 'Treueherzen' })).toBe('Option: Treueherzen');
  });

  it('handles templates with both [points_label] and [account_balance]', () => {
    const template = 'Weiter sammeln ([account_balance] [points_label] verfügbar) und keine [points_label] einlösen.';
    const result = replaceLoyalistaCheckoutTokens(
      template,
      { accountBalance: 1250, pointsLabel: 'Testpunkte' },
      'de-DE',
    );
    expect(result).toBe('Weiter sammeln (1.250 Testpunkte verfügbar) und keine Testpunkte einlösen.');
  });
});

describe('calculateMaxPointsByBasket', () => {
  it('returns 0 when basketTotal or pointToValue is 0, negative, NaN or non-finite', () => {
    expect(calculateMaxPointsByBasket(0, 0.01)).toBe(0);
    expect(calculateMaxPointsByBasket(-10, 0.01)).toBe(0);
    expect(calculateMaxPointsByBasket(100, 0)).toBe(0);
    expect(calculateMaxPointsByBasket(100, -0.01)).toBe(0);
    expect(calculateMaxPointsByBasket(NaN, 0.01)).toBe(0);
    expect(calculateMaxPointsByBasket(100, NaN)).toBe(0);
    expect(calculateMaxPointsByBasket(Infinity, 0.01)).toBe(0);
    expect(calculateMaxPointsByBasket(100, Infinity)).toBe(0);
  });

  it('calculates exact whole points for normal amounts', () => {
    expect(calculateMaxPointsByBasket(10.0, 0.01)).toBe(1000);
    expect(calculateMaxPointsByBasket(50.0, 0.02)).toBe(2500);
    expect(calculateMaxPointsByBasket(49.99, 0.01)).toBe(4999);
    expect(calculateMaxPointsByBasket(100.0, 0.01)).toBe(10000);
  });

  it('matches backend CheckoutController::createCoupon validation threshold strictly', () => {
    // In PHP: $max_points = floatval(77.74 / 0.01) is 7773.99999999999909.
    // If client sent 7774, backend would reject with errorInvalidPointsAmount (7774 > 7773.999...).
    // Strict Math.floor yields 7773, which is 100% accepted by backend and coupon value is <= basketTotal.
    expect(calculateMaxPointsByBasket(77.74, 0.01)).toBe(7773);
    // In PHP: $max_points = floatval(19.99 / 0.01) is 1998.99999999999977.
    // Strict Math.floor yields 1998, which is 100% accepted by backend.
    expect(calculateMaxPointsByBasket(19.99, 0.01)).toBe(1998);
  });

  it('never overshoots basket total on partial fractions', () => {
    // 10.009 / 0.01 = 1000.9 -> max whole points must be 1000 (10.00 <= 10.009)
    expect(calculateMaxPointsByBasket(10.009, 0.01)).toBe(1000);
    // 0.009 / 0.01 = 0.9 -> max whole points must be 0
    expect(calculateMaxPointsByBasket(0.009, 0.01)).toBe(0);
  });
});


