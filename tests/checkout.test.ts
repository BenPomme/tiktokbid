import { describe, expect, it } from "vitest";
import {
  CheckoutValidationError,
  minimumCheckoutCents,
  validateCheckoutInput,
} from "@/lib/checkout";
import { MIN_BID_CENTS } from "@/lib/money";

describe("minimumCheckoutCents", () => {
  it("is MIN_BID on empty board", () => {
    expect(minimumCheckoutCents(null, 0)).toBe(MIN_BID_CENTS);
    expect(minimumCheckoutCents(0, 0)).toBe(MIN_BID_CENTS);
  });

  it("requires #1 + $2 when listing has no active bids", () => {
    expect(minimumCheckoutCents(1000, 0)).toBe(1200);
  });

  it("only requires the gap when raising toward #1", () => {
    expect(minimumCheckoutCents(1000, 500)).toBe(700);
  });

  it("clamps to MIN_BID when already #1 (raise)", () => {
    expect(minimumCheckoutCents(1000, 1000)).toBe(MIN_BID_CENTS);
  });
});

describe("validateCheckoutInput", () => {
  const good = {
    url: "https://shop.tiktok.com/view/product/123",
    title: "Widget",
    amount: 2,
  };

  it("accepts minimum bid on empty board", () => {
    const v = validateCheckoutInput(good, {
      currentNumberOneActiveTotal: null,
      existingListingActiveTotal: 0,
    });
    expect(v.amountCents).toBe(200);
    expect(v.urlKey).toContain("shop.tiktok.com");
  });

  it("rejects non–TikTok Shop URLs", () => {
    expect(() =>
      validateCheckoutInput(
        { ...good, url: "https://example.com/x" },
        { currentNumberOneActiveTotal: null, existingListingActiveTotal: 0 },
      ),
    ).toThrow(CheckoutValidationError);
  });

  it("rejects amount below take-#1 minimum", () => {
    expect(() =>
      validateCheckoutInput(
        { ...good, amount: 5 },
        { currentNumberOneActiveTotal: 1000, existingListingActiveTotal: 0 },
      ),
    ).toThrow(/take #1/i);
  });
});
