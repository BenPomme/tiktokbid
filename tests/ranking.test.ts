import { describe, expect, it } from "vitest";
import {
  minCentsToTakeNumberOne,
  recomputeActiveTotal,
  sortListingsForBoard,
} from "@/lib/ranking";
import { MIN_BID_CENTS, TAKE_ONE_DELTA_CENTS } from "@/lib/money";

describe("minCentsToTakeNumberOne", () => {
  it("returns MIN_BID_CENTS when there is no current #1", () => {
    expect(minCentsToTakeNumberOne(0)).toBe(MIN_BID_CENTS);
    expect(minCentsToTakeNumberOne(null)).toBe(MIN_BID_CENTS);
  });

  it("requires current #1 active total plus $2 to take #1", () => {
    expect(minCentsToTakeNumberOne(500)).toBe(500 + TAKE_ONE_DELTA_CENTS);
    expect(minCentsToTakeNumberOne(200)).toBe(400);
  });
});

describe("recomputeActiveTotal", () => {
  it("sums only non-expired bids", () => {
    const now = new Date("2026-08-23T12:00:00.000Z");
    const bids = [
      { amountCents: 200, expiresAt: new Date("2026-08-24T12:00:00.000Z") },
      { amountCents: 300, expiresAt: new Date("2026-08-22T12:00:00.000Z") },
      { amountCents: 100, expiresAt: new Date("2026-09-01T00:00:00.000Z") },
    ];
    expect(recomputeActiveTotal(bids, now)).toBe(300);
  });

  it("returns 0 when all bids are expired", () => {
    const now = new Date("2026-08-23T12:00:00.000Z");
    const bids = [
      { amountCents: 200, expiresAt: new Date("2026-08-20T12:00:00.000Z") },
    ];
    expect(recomputeActiveTotal(bids, now)).toBe(0);
  });
});

describe("sortListingsForBoard", () => {
  it("ranks paid listings with activeTotalCents > 0 by activeTotal desc", () => {
    const listings = [
      {
        id: "a",
        source: "paid" as const,
        activeTotalCents: 200,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
      },
      {
        id: "b",
        source: "paid" as const,
        activeTotalCents: 500,
        createdAt: new Date("2026-08-02T00:00:00.000Z"),
      },
    ];
    const sorted = sortListingsForBoard(listings);
    expect(sorted.map((l) => l.id)).toEqual(["b", "a"]);
  });

  it("keeps trending and zero-active paid below any paid with activeTotal > 0", () => {
    const listings = [
      {
        id: "trend-hot",
        source: "trending" as const,
        activeTotalCents: 0,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
      },
      {
        id: "paid-active",
        source: "paid" as const,
        activeTotalCents: 200,
        createdAt: new Date("2026-08-03T00:00:00.000Z"),
      },
      {
        id: "paid-zero",
        source: "paid" as const,
        activeTotalCents: 0,
        createdAt: new Date("2026-08-02T00:00:00.000Z"),
      },
      {
        id: "trend-2",
        source: "trending" as const,
        activeTotalCents: 999,
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    ];
    const sorted = sortListingsForBoard(listings);
    expect(sorted[0]?.id).toBe("paid-active");
    expect(sorted.slice(1).map((l) => l.id)).toEqual(
      expect.arrayContaining(["trend-hot", "paid-zero", "trend-2"]),
    );
    expect(sorted.findIndex((l) => l.id === "paid-active")).toBe(0);
  });

  it("breaks active-paid ties with earlier createdAt first", () => {
    const listings = [
      {
        id: "later",
        source: "paid" as const,
        activeTotalCents: 400,
        createdAt: new Date("2026-08-10T00:00:00.000Z"),
      },
      {
        id: "earlier",
        source: "paid" as const,
        activeTotalCents: 400,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
      },
    ];
    const sorted = sortListingsForBoard(listings);
    expect(sorted.map((l) => l.id)).toEqual(["earlier", "later"]);
  });
});
