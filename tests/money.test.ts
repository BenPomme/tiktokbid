import { describe, expect, it } from "vitest";
import {
  BID_TTL_MS,
  MIN_BID_CENTS,
  TAKE_ONE_DELTA_CENTS,
  dollarsToCents,
} from "@/lib/money";

describe("money constants", () => {
  it("minimum bid is $2 (200 cents)", () => {
    expect(MIN_BID_CENTS).toBe(200);
    expect(dollarsToCents(2)).toBe(MIN_BID_CENTS);
  });

  it("take-#1 delta is +$2 (200 cents)", () => {
    expect(TAKE_ONE_DELTA_CENTS).toBe(200);
  });

  it("bid TTL is 10 days in milliseconds", () => {
    const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
    expect(BID_TTL_MS).toBe(tenDaysMs);
  });
});

describe("dollarsToCents", () => {
  it("converts whole dollars to integer cents", () => {
    expect(dollarsToCents(2)).toBe(200);
    expect(dollarsToCents(10)).toBe(1000);
    expect(dollarsToCents(0)).toBe(0);
  });
});
