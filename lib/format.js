/**
 * Shared Indian-currency formatting utilities.
 * Used by both frontend pages and server agents (Node-compatible, no JSX).
 */

/**
 * Formats a number as ₹X,XX,XXX (plain rupees, en-IN locale).
 * @param {number} n
 * @returns {string}
 */
export function formatINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

/**
 * Formats large amounts using Crore / Lakh abbreviations.
 * Falls back to formatINR for smaller amounts.
 * @param {number} n
 * @returns {string}
 */
export function formatCr(n) {
  if (n >= 10_000_000) return '₹' + (n / 10_000_000).toFixed(2) + ' Cr'
  if (n >= 100_000)    return '₹' + (n / 100_000).toFixed(2) + ' L'
  return formatINR(n)
}
