/**
 * FX-converted display formatter.
 *
 * Source of truth for currency display. Backend stores / charges in USD;
 * this module converts to other currencies for display only.
 */

/**
 * Format a USD value as a localized string in the target currency.
 *
 * @param {number|string} usdValue — value in USD
 * @param {string}        currency — ISO-4217 currency code (e.g. "EUR")
 * @param {number}        rate     — rate against USD (1 USD = `rate` currency)
 * @returns {string} e.g. "€94.95", "$94.95"
 *
 * Falls back to USD when rate is missing/invalid so the UI never crashes
 * if the upstream rates API is unreachable.
 */
export function fmtInCurrency(usdValue, currency = "USD", rate = 1) {
  const value = Number(usdValue);
  if (!Number.isFinite(value)) return "$0.00";
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
  const converted = currency.toUpperCase() === "USD" ? value : value * safeRate;
  // Always use "$" symbol for consistency across all orders
  if (currency.toUpperCase() === "USD") {
    return `$${converted.toFixed(2)}`;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(converted);
  } catch {
    return `$${converted.toFixed(2)}`;
  }
}

/**
 * Convert a USD amount into the target currency using a rate map.
 * Returns a plain number, no formatting.
 */
export function convertUsdTo(usdValue, currency, rates) {
  const value = Number(usdValue);
  if (!Number.isFinite(value)) return 0;
  if (!rates || !currency || currency === "USD") return value;
  const r = rates[currency];
  return Number.isFinite(r) && r > 0 ? value * r : value;
}
