import { MIN_BID_CENTS, TAKE_ONE_DELTA_CENTS } from "./money";

export type BidLike = {
  amountCents: number;
  expiresAt: Date;
};

export type BoardListing = {
  id: string;
  source: "paid" | "trending";
  activeTotalCents: number;
  createdAt: Date;
};

/** Sum amountCents for bids that have not yet expired. */
export function recomputeActiveTotal(
  bids: BidLike[],
  now: Date = new Date(),
): number {
  const nowMs = now.getTime();
  return bids.reduce((sum, bid) => {
    if (bid.expiresAt.getTime() > nowMs) {
      return sum + bid.amountCents;
    }
    return sum;
  }, 0);
}

/**
 * Minimum cents required for a new/raise bid to become #1.
 * Empty board → MIN_BID_CENTS; otherwise current #1 active total + TAKE_ONE_DELTA_CENTS.
 */
export function minCentsToTakeNumberOne(
  currentNumberOneActiveTotalCents: number | null,
): number {
  if (
    currentNumberOneActiveTotalCents == null ||
    currentNumberOneActiveTotalCents <= 0
  ) {
    return MIN_BID_CENTS;
  }
  return currentNumberOneActiveTotalCents + TAKE_ONE_DELTA_CENTS;
}

function isRankedPaid(listing: BoardListing): boolean {
  return listing.source === "paid" && listing.activeTotalCents > 0;
}

/**
 * Paid with activeTotalCents > 0 first (activeTotal DESC, then earlier createdAt).
 * Trending and zero-active paid sit below all ranked paid listings.
 */
export function sortListingsForBoard<T extends BoardListing>(
  listings: T[],
): T[] {
  return [...listings].sort((a, b) => {
    const aRanked = isRankedPaid(a);
    const bRanked = isRankedPaid(b);

    if (aRanked && !bRanked) return -1;
    if (!aRanked && bRanked) return 1;

    if (aRanked && bRanked) {
      if (b.activeTotalCents !== a.activeTotalCents) {
        return b.activeTotalCents - a.activeTotalCents;
      }
      const byCreated =
        a.createdAt.getTime() - b.createdAt.getTime();
      if (byCreated !== 0) return byCreated;
      return a.id.localeCompare(b.id);
    }

    // Both unranked (trending / zero-active paid): stable by createdAt then id
    const byCreated = a.createdAt.getTime() - b.createdAt.getTime();
    if (byCreated !== 0) return byCreated;
    return a.id.localeCompare(b.id);
  });
}
