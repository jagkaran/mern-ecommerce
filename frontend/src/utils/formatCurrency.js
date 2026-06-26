/**
 * Currency / number formatting utilities.
 * Single source of truth for all money display across the app.
 */

/**
 * Format a number as a USD price string with exactly 2 decimal places.
 *   fmt(94.95)  → "$94.95"
 *   fmt(14.24)  → "$14.24"
 *   fmt(0)      → "$0.00"
 */
export function fmt(value) {
  return `$${Number(value).toFixed(2)}`;
}

/**
 * Format a raw number as a plain 2dp string (no $ sign).
 * Useful for line-item math display: "94.95 X 1 = 94.95"
 */
export function fmtNum(value) {
  return Number(value).toFixed(2);
}

/**
 * Alias kept for backward compat — same as fmtNum.
 * formatPrice was the old name in utils/fmt.js.
 */
export const formatPrice = fmtNum;
