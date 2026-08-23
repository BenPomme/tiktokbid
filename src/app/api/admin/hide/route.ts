import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

function extractPassword(request: NextRequest, body: unknown): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  if (body && typeof body === "object" && "password" in body) {
    const password = (body as { password?: unknown }).password;
    if (typeof password === "string") return password;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "Admin is not configured (ADMIN_PASSWORD missing). Set it in the environment to enable hide.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password = extractPassword(request, body);
  if (!password || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id =
    body && typeof body === "object" && "id" in body
      ? (body as { id?: unknown }).id
      : undefined;

  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const db = getDb();
  const listing = await db.listing.findUnique({
    where: { id: id.trim() },
    select: { id: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.listing.update({
    where: { id: listing.id },
    data: { hidden: true },
  });

  return NextResponse.json({ ok: true, id: listing.id });
}
