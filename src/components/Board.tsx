type BoardListingRow = {
  id: string;
  title: string;
  source: "paid" | "trending";
  activeTotalCents: number;
  clickCount: number;
};

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function isRankedPaid(listing: BoardListingRow): boolean {
  return listing.source === "paid" && listing.activeTotalCents > 0;
}

type BoardProps = {
  /** Already sorted with sortListingsForBoard. */
  listings: BoardListingRow[];
};

export function Board({ listings }: BoardProps) {
  const ranked = listings.filter(isRankedPaid);
  const rest = listings.filter((l) => !isRankedPaid(l));

  return (
    <section className="space-y-8" aria-label="Listings board">
      <div>
        <h2 className="mb-3 text-lg font-semibold">Paid rankings</h2>
        {ranked.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No paid listings yet. Be the first to bid.
          </p>
        ) : (
          <ListingTable rows={ranked} showRank />
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Trending</h2>
        {rest.length === 0 ? (
          <p className="text-sm text-zinc-500">No trending listings yet.</p>
        ) : (
          <ListingTable rows={rest} showRank={false} />
        )}
      </div>
    </section>
  );
}

function ListingTable({
  rows,
  showRank,
}: {
  rows: BoardListingRow[];
  showRank: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
          <tr>
            {showRank ? <th className="px-3 py-2 font-medium">#</th> : null}
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium text-right">Active</th>
            <th className="px-3 py-2 font-medium text-right">Clicks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className="border-b border-zinc-100 last:border-0"
            >
              {showRank ? (
                <td className="px-3 py-2 tabular-nums text-zinc-500">
                  {index + 1}
                </td>
              ) : null}
              <td className="px-3 py-2">
                <a
                  href={`/out/${row.id}`}
                  className="font-medium text-sky-700 underline-offset-2 hover:underline"
                >
                  {row.title}
                </a>
                {!showRank && row.source === "paid" ? (
                  <span className="ml-2 text-xs text-zinc-400">
                    (expired)
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatDollars(row.activeTotalCents)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {row.clickCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
