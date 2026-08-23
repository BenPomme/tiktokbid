import { NextRequest, NextResponse } from "next/server";
import { ListingSource } from "@prisma/client";
import {
  CheckoutValidationError,
  type CheckoutInput,
  validateCheckoutInput,
} from "@/lib/checkout";
import { getDb } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { normalizeTikTokShopUrl } from "@/lib/url";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured (STRIPE_SECRET_KEY missing). Add keys to enable checkout.",
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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = body as CheckoutInput;
  const db = getDb();

  // Look up existing listing active total when URL is parseable; URL errors
  // are still surfaced by validateCheckoutInput below.
  let existingActive = 0;
  if (typeof input.url === "string" && input.url.trim()) {
    try {
      const { urlKey } = normalizeTikTokShopUrl(input.url);
      const existing = await db.listing.findUnique({
        where: { urlKey },
        select: { activeTotalCents: true },
      });
      if (existing) {
        existingActive = existing.activeTotalCents;
      }
    } catch {
      // defer to validateCheckoutInput
    }
  }

  const topPaid = await db.listing.findFirst({
    where: {
      source: ListingSource.paid,
      activeTotalCents: { gt: 0 },
      hidden: false,
    },
    orderBy: [{ activeTotalCents: "desc" }, { createdAt: "asc" }],
    select: { activeTotalCents: true },
  });
  const currentNumberOneActiveTotal = topPaid?.activeTotalCents ?? null;

  let validated;
  try {
    validated = validateCheckoutInput(input, {
      currentNumberOneActiveTotal,
      existingListingActiveTotal: existingActive,
    });
  } catch (err) {
    if (err instanceof CheckoutValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=canceled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: validated.amountCents,
            product_data: {
              name: `TikTokBid: ${validated.title}`,
              description: `Bid for ${validated.url}`,
            },
          },
        },
      ],
      metadata: {
        url: validated.url,
        urlKey: validated.urlKey,
        title: validated.title,
        amountCents: String(validated.amountCents),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("checkout session error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
