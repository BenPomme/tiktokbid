import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ListingSource } from "@prisma/client";
import { getDb } from "@/lib/db";

function draftPitch(listing: {
  id: string;
  title: string;
  category: string | null;
  url: string;
}): string {
  const categoryHint = listing.category
    ? ` in ${listing.category}`
    : "";

  return `# Outreach draft — ${listing.title}

**Listing id:** ${listing.id}
**Product URL:** ${listing.url}

---

Hi there —

Noticed **${listing.title}**${categoryHint} on TikTok Shop and thought it could do well with a bit more deliberate placement in front of sellers who are already shopping for products to promote.

We run **TikTokBid**, a small US TikTok Shop pay-to-rank board. Your listing is already on our free trending shelf. If you want it higher on the paid ranks (above free shelf items), a **$2 bid** is enough to get on the board — bids last 10 days.

No pressure and no blast list; this is a one-off note because the product looks like a fit.

**Board CTA:** {{BOARD_URL}} — search for your product title or paste your TikTok Shop link to bid.

Happy to answer questions if useful.

— TikTokBid
`;
}

async function main() {
  const db = getDb();
  const outDir = resolve(process.cwd(), "data/outreach");
  mkdirSync(outDir, { recursive: true });

  // Prefer trending; if none, draft for all non-hidden listings.
  let listings = await db.listing.findMany({
    where: { hidden: false, source: ListingSource.trending },
    orderBy: { createdAt: "asc" },
  });

  if (listings.length === 0) {
    listings = await db.listing.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "asc" },
    });
  }

  let written = 0;
  for (const listing of listings) {
    const path = resolve(outDir, `${listing.id}.md`);
    writeFileSync(path, draftPitch(listing), "utf8");
    written += 1;
    console.log(`wrote ${path}`);
  }

  console.log(JSON.stringify({ written, outDir }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getDb().$disconnect();
  });
