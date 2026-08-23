import {
  BID_TTL_MS,
  MIN_BID_CENTS,
  TAKE_ONE_DELTA_CENTS,
} from "@/lib/money";

function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function ttlDays(ms: number): number {
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export default function RulesPage() {
  const minBid = centsToDollars(MIN_BID_CENTS);
  const takeOne = centsToDollars(TAKE_ONE_DELTA_CENTS);
  const days = ttlDays(BID_TTL_MS);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rules</h1>
        <p className="mt-1 text-sm text-zinc-600">
          How bidding and ranking work on TikTokBid.
        </p>
      </header>

      <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-zinc-800">
        <li>
          <strong>Minimum bid:</strong> {minBid} to place a paid listing on the
          board.
        </li>
        <li>
          <strong>Take #1:</strong> your active total must beat the current #1 by
          at least {takeOne} (i.e. +{takeOne} above #1&apos;s active total).
        </li>
        <li>
          <strong>Bid expiry:</strong> each bid counts toward the active total
          for {days} days from payment, then ages out.
        </li>
        <li>
          <strong>Trending shelf:</strong> unpaid / free trending listings sit
          below the paid rankings on the board.
        </li>
      </ul>
    </main>
  );
}
