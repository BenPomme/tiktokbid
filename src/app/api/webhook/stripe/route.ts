import { NextRequest, NextResponse } from "next/server";
import { ListingSource } from "@prisma/client";
import type Stripe from "stripe";
import { getDb } from "@/lib/db";
import { BID_TTL_MS } from "@/lib/money";
import { recomputeActiveTotal } from "@/lib/ranking";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Next.js App Router: read raw body via request.text() for Stripe signature verify.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set" },
      { status: 503 },
    );
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not set" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("stripe webhook signature error:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await handleCheckoutCompleted(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : "handler failed";
      console.error("checkout.session.completed handler error:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripeSessionId = session.id;
  const db = getDb();

  // Idempotent: skip if we already credited this Checkout Session.
  const existingBid = await db.bid.findUnique({
    where: { stripeSessionId },
    select: { id: true },
  });
  if (existingBid) {
    return;
  }

  const meta = session.metadata ?? {};
  const url = meta.url?.trim();
  const urlKey = meta.urlKey?.trim();
  const title = meta.title?.trim() || "Untitled listing";
  const amountCents = Number.parseInt(meta.amountCents ?? "", 10);

  if (!url || !urlKey || !Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error(
      `checkout.session.completed missing metadata (session ${stripeSessionId})`,
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + BID_TTL_MS);

  // Upsert Listing by urlKey; promote to paid and refresh title/url on payment.
  const listing = await db.listing.upsert({
    where: { urlKey },
    create: {
      url,
      urlKey,
      title,
      source: ListingSource.paid,
      activeTotalCents: 0,
    },
    update: {
      url,
      title,
      source: ListingSource.paid,
    },
  });

  await db.bid.create({
    data: {
      listingId: listing.id,
      amountCents,
      stripeSessionId,
      expiresAt,
    },
  });

  const bids = await db.bid.findMany({
    where: { listingId: listing.id },
    select: { amountCents: true, expiresAt: true },
  });
  const activeTotalCents = recomputeActiveTotal(bids, now);

  await db.listing.update({
    where: { id: listing.id },
    data: { activeTotalCents },
  });
}
