/**
 * Shared price formatter — always 2 decimal places.
 * Usage: formatPrice(19.9) => "19.90"
 *        formatPrice(268.385) => "268.39"
 */
export const formatPrice = (n) => Number(n).toFixed(2);
