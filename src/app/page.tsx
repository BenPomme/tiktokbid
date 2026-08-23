import { BidForm } from "@/components/BidForm";
import { Board } from "@/components/Board";
import { StatsBar } from "@/components/StatsBar";
import { getDb } from "@/lib/db";
import {
  minCentsToTakeNumberOne,
  sortListingsForBoard,
} from "@/lib/ranking";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = getDb();

  const [listings, bidSum] = await Promise.all([
    db.listing.findMany({
      where: { hidden: false },
      select: {
        id: true,
        title: true,
        source: true,
        activeTotalCents: true,
        clickCount: true,
        createdAt: true,
      },
    }),
    db.bid.aggregate({
      _sum: { amountCents: true },
    }),
  ]);

  const sorted = sortListingsForBoard(listings);
  const numberOneActive =
    sorted.find((l) => l.source === "paid" && l.activeTotalCents > 0)
      ?.activeTotalCents ?? 0;
  const numberOneCostCents = minCentsToTakeNumberOne(
    numberOneActive > 0 ? numberOneActive : null,
  );
  const grossCents = bidSum._sum.amountCents ?? 0;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          TikTokBid
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Pay to rank on the US TikTok Shop board.
        </p>
      </header>

      <StatsBar
        grossCents={grossCents}
        numberOneCostCents={numberOneCostCents}
      />
      <Board listings={sorted} />
      <BidForm />
    </main>
  );
}
