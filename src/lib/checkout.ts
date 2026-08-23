import { MIN_BID_CENTS, dollarsToCents } from "@/lib/money";
import { minCentsToTakeNumberOne } from "@/lib/ranking";
import { normalizeTikTokShopUrl } from "@/lib/url";

export type CheckoutInput = {
  url?: unknown;
  title?: unknown;
  amount?: unknown;
};

export type ValidatedCheckout = {
  url: string;
  urlKey: string;
  title: string;
  amountCents: number;
};

/**
 * Minimum charge for a checkout that ADDS `amount` to this listing's active total.
 *
 * MVP rule (documented): every successful payment must leave the listing able to
 * claim/hold #1 after the new bid is applied:
 *   minCharge = max(
 *     MIN_BID_CENTS,
 *     minCentsToTakeNumberOne(currentNumberOneActiveTotal) - existingListingActiveTotal
 *   )
 * Clamped to at least MIN_BID_CENTS. Raises still pay the submitted whole-dollar amount.
 */
export function minimumCheckoutCents(
  currentNumberOneActiveTotal: number | null,
  existingListingActiveTotal: number,
): number {
  const toTakeOne = minCentsToTakeNumberOne(currentNumberOneActiveTotal);
  const needed = toTakeOne - Math.max(0, existingListingActiveTotal);
  return Math.max(MIN_BID_CENTS, needed);
}

/**
 * Validate BidForm payload: TikTok Shop URL + title + dollar amount.
 * Does not touch the DB; caller supplies ranking totals for the min-charge check.
 */
export function validateCheckoutInput(
  body: CheckoutInput,
  opts: {
    currentNumberOneActiveTotal: number | null;
    existingListingActiveTotal: number;
  },
): ValidatedCheckout {
  if (typeof body.url !== "string" || !body.url.trim()) {
    throw new CheckoutValidationError("url is required");
  }
  if (typeof body.title !== "string" || !body.title.trim()) {
    throw new CheckoutValidationError("title is required");
  }
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount)) {
    throw new CheckoutValidationError("amount must be a finite number (USD)");
  }

  let normalized;
  try {
    normalized = normalizeTikTokShopUrl(body.url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid TikTok Shop URL";
    throw new CheckoutValidationError(message);
  }

  const amountCents = dollarsToCents(body.amount);
  if (amountCents < MIN_BID_CENTS) {
    throw new CheckoutValidationError(
      `Minimum bid is $${(MIN_BID_CENTS / 100).toFixed(2)}`,
    );
  }

  const minCharge = minimumCheckoutCents(
    opts.currentNumberOneActiveTotal,
    opts.existingListingActiveTotal,
  );
  if (amountCents < minCharge) {
    throw new CheckoutValidationError(
      `Bid too low to take #1: pay at least $${(minCharge / 100).toFixed(2)} (adds to this listing's active total)`,
    );
  }

  return {
    url: normalized.url,
    urlKey: normalized.urlKey,
    title: body.title.trim(),
    amountCents,
  };
}

export class CheckoutValidationError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}
