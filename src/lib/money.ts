/** Minimum first bid: $2.00 */
export const MIN_BID_CENTS = 200;

/** Extra cents required above current #1 active total to take #1: +$2.00 */
export const TAKE_ONE_DELTA_CENTS = 200;

/** Bid remains in active total for 10 days from payment. */
export const BID_TTL_MS = 10 * 24 * 60 * 60 * 1000;

/** Convert whole (or fractional) dollars to integer cents. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
