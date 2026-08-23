import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ListingSource } from "@prisma/client";
import { getDb } from "@/lib/db";
import { normalizeTikTokShopUrl } from "@/lib/url";

type SeedProduct = {
  url: string;
  title: string;
  category?: string;
};

async function main() {
  const seedPath = resolve(process.cwd(), "data/seed-products.json");
  const products = JSON.parse(readFileSync(seedPath, "utf8")) as SeedProduct[];

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("data/seed-products.json must be a non-empty array");
  }

  const db = getDb();
  let created = 0;
  let updated = 0;
  let skippedPaid = 0;

  for (const product of products) {
    if (!product?.url || !product?.title) {
      console.warn("Skipping invalid seed row (need url + title):", product);
      continue;
    }

    const { url, urlKey } = normalizeTikTokShopUrl(product.url);
    const title = product.title.trim();
    const category = product.category?.trim() || null;

    const existing = await db.listing.findUnique({ where: { urlKey } });

    if (existing?.source === ListingSource.paid) {
      // Never demote a paid listing to trending; optionally fill empty title.
      if ((!existing.title || !existing.title.trim()) && title) {
        await db.listing.update({
          where: { id: existing.id },
          data: { title },
        });
        console.log(`paid listing ${existing.id}: filled title only`);
      } else {
        console.log(`skip paid listing ${existing.id} (${urlKey})`);
      }
      skippedPaid += 1;
      continue;
    }

    if (existing) {
      await db.listing.update({
        where: { id: existing.id },
        data: {
          url,
          title,
          category,
          source: ListingSource.trending,
        },
      });
      updated += 1;
      console.log(`updated trending ${existing.id}: ${title}`);
    } else {
      const createdListing = await db.listing.create({
        data: {
          url,
          urlKey,
          title,
          category,
          source: ListingSource.trending,
        },
      });
      created += 1;
      console.log(`created trending ${createdListing.id}: ${title}`);
    }
  }

  const trendingCount = await db.listing.count({
    where: { source: ListingSource.trending, hidden: false },
  });

  console.log(
    JSON.stringify({ created, updated, skippedPaid, trendingCount }, null, 2),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getDb().$disconnect();
  });
