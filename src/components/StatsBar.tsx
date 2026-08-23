function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

type StatsBarProps = {
  /** Sum of all Bid.amountCents (all-time, including expired). */
  grossCents: number;
  /** From minCentsToTakeNumberOne(...). */
  numberOneCostCents: number;
};

export function StatsBar({
  grossCents,
  numberOneCostCents,
}: StatsBarProps) {
  return (
    <section
      className="flex flex-wrap gap-4 sm:gap-8 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm sm:text-base"
      aria-label="Board stats"
    >
      <p>
        <span className="text-zinc-500">All-time gross </span>
        <span className="font-semibold tabular-nums">
          {formatDollars(grossCents)}
        </span>
      </p>
      <p>
        <span className="text-zinc-500">#1 costs </span>
        <span className="font-semibold tabular-nums">
          {formatDollars(numberOneCostCents)}
        </span>
      </p>
    </section>
  );
}
