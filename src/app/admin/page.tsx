import { AdminClient } from "./AdminClient";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">Admin unavailable</h1>
        <p className="text-sm text-zinc-600">
          Admin is not configured (ADMIN_PASSWORD missing). Set ADMIN_PASSWORD
          in the environment to enable this page. HTTP status equivalent: 503.
        </p>
      </main>
    );
  }

  const db = getDb();
  const rows = await db.listing.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      source: true,
      activeTotalCents: true,
      clickCount: true,
      hidden: true,
      createdAt: true,
    },
  });

  const listings = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Hide listings from the public board. Recent 50 shown.
        </p>
      </header>
      <AdminClient listings={listings} />
    </main>
  );
}
