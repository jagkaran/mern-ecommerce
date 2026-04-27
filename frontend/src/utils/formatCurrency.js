/**
 * Format a number as a USD price string with exactly 2 decimal places.
 * Use this everywhere a monetary value is displayed to the user.
 *
 * Examples:
 *   fmt(94.95)    → "$94.95"
 *   fmt(14.2425)  → "$14.24"
 *   fmt(0)        → "$0.00"
 *
 * @param {number} value
 * @returns {string}
 */
export function fmt(value) {
  return `$${Number(value).toFixed(2)}`;
}

/**
 * Format a raw number as a plain 2dp string (no $ sign).
 * Useful for line-item math display: "94.95 X 1 = 94.95"
 *
 * @param {number} value
 * @returns {string}
 */
export function fmtNum(value) {
  return Number(value).toFixed(2);
}
