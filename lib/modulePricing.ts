/**
 * Whether a module can be bought outright, or has to go through admin as a
 * request.
 *
 * A price of 0 means "not priced yet" for modules — placeholder rows and
 * anything the scraper hasn't reached carry 0 or null. Backend agrees: such a
 * module enters the cart as `is_request` (services/cartPricing.js), so the UI
 * must not offer a buy button for it. Prices arrive as numbers, but coerce
 * anyway: a raw numeric column read outside drizzle's mapping comes back as
 * "0.00", which is truthy and used to render 0-price modules as purchasable.
 */
export type ModulePriceState = 'purchasable' | 'needs_price' | 'unavailable';

interface ModulePricingInput {
  is_available?: boolean;
  price_student?: number | string | null;
}

export function modulePriceState(module: ModulePricingInput): ModulePriceState {
  const price = Number(module.price_student ?? 0);
  const hasPrice = Number.isFinite(price) && price > 0;
  if (!hasPrice) return 'needs_price';
  return module.is_available ? 'purchasable' : 'unavailable';
}

export function isModulePurchasable(module: ModulePricingInput): boolean {
  return modulePriceState(module) === 'purchasable';
}

/** Label for the add-to-cart button. Requests read as a favour asked, not a purchase. */
export function moduleCtaLabel(module: ModulePricingInput): string {
  return isModulePurchasable(module) ? 'Tambah ke Keranjang' : 'Minta Buku Ini';
}
