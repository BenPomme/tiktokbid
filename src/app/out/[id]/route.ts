import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const db = getDb();
  const listing = await db.listing.findFirst({
    where: { id, hidden: false },
    select: { id: true, url: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.listing.update({
    where: { id: listing.id },
    data: { clickCount: { increment: 1 } },
  });

  return NextResponse.redirect(listing.url, 302);
}
