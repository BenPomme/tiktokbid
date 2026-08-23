# TikTokBid Design Spec

**Date:** 2026-08-23  
**Working title:** TikTokBid (final name can change before launch)  
**Owner:** Benjamin Pommeraud + money agent  
**Status:** Draft for implementation

## 1. Problem & goal

US TikTok Shop sellers pay for attention before Q4. Outbid-style pay-to-rank boards printed large short-term revenue this week; AI-tool niches are already cloned. We ship a **TikTok Shop–only** pay-to-rank board and drive traffic with **agent-automated** discovery, free trending shelf, outreach, and content — without relying on the founder’s personal seller network.

**Success (v1):** $10,000 gross bid revenue within 14 days of public launch.

## 2. Positioning

**One-liner:** The public leaderboard where US TikTok Shop sellers pay to own #1.

**Primary bidders:** TikTok Shop sellers and brands (US first).  
**Not for:** random affiliates as primary ICP, non–TikTok Shop links, NSFW, chat invites.

**Differentiation:** Audience + URL rules (TikTok Shop), not a new auction mechanic. Free “trending” shelf so the board never looks empty without friends seeding paid bids.

## 3. Core product loop

1. Seller submits a US TikTok Shop product or shop URL + bid amount.
2. Stripe Checkout; bid counts only after `checkout.session.completed`.
3. Rank = sum of **active** (non-expired) paid bid cents.
4. Public counters: total $ collected, current #1 price, listing click counts via `/out/[id]`.
5. Agent discovers hot products → free trending shelf → outreach to convert to paid.

## 4. Bidding economy

| Rule | Value |
|------|--------|
| Minimum first bid | **$2** |
| Increment to take #1 | **+$2** over current #1 active total |
| Raise existing listing | Pay difference only; whole dollars |
| Bid expiry | **10 days** from payment, then that bid’s amount drops from active total |
| Free shelf | Non-ranked trending listings; $0; sit below all paid ranks |
| Demo bids | Optional clearly labeled until first real payment; remove when live money hits |

## 5. Zero-upfront stack

| Layer | Choice | Cost day 0 |
|-------|--------|------------|
| App | Next.js App Router, TypeScript, Tailwind | $0 |
| Host | Vercel Hobby (`*.vercel.app`) | $0 |
| DB | Turso free (hosted libSQL/SQLite) | $0 |
| Payments | Stripe Checkout + webhooks | $0 until charges (fees only) |
| Repo | GitHub (connector installed) | $0 |
| Domain | Deferred until after first revenue | $0 |
| Analytics | First-party counters only | $0 |

**Accounts needed from user when building:** Stripe (keys when checkout is wired). Vercel deploy can use their existing Vercel account (connector optional; CLI/dashboard OK).

## 6. Architecture

### Components

1. **Board page** — paid ranks + free trending shelf, filters (category cosmetic), bid CTA, live stats.
2. **Checkout API** — create Stripe Checkout session (new listing or raise); metadata: listingId, url, amountCents.
3. **Webhook** — credit Bid row; recompute active totals; ignore unpaid.
4. **Outbound** `/out/[id]` — redirect + click increment.
5. **Admin** — env-password hide/delete spam.
6. **Rules / About** — AUP, expiry, TikTok Shop-only.
7. **Agent jobs** (scripts/routines, not required in first HTML paint): discover products, upsert free shelf, draft outreach, draft X posts.

### Data model (minimal)

- `Listing`: id, url, title, category, source (`paid` \| `trending`), activeTotalCents, clickCount, hidden, createdAt
- `Bid`: id, listingId, amountCents, stripeSessionId, createdAt, expiresAt
- `OutreachDraft` (optional file/DB later): listingId, channel, copy, status

### Ranking

- Paid listings ordered by `activeTotalCents` DESC (sum of bids where `expiresAt > now`).
- Ties: earlier listing wins.
- Free trending never outranks any paid listing with `activeTotalCents > 0`.

### URL validation

- Allow hosts associated with TikTok Shop / shop.tiktok.com (and documented US shop patterns).
- Strip tracking query params; reject chat invite hosts; reject NSFW heuristics + admin.

## 7. Go-to-market (automated, compressed)

**Ship target:** public MVP in **24–48 hours**.

1. **Discovery (agent):** daily pull of viral US TikTok Shop products from X + web; fill free shelf.
2. **Outreach (agent):** personalized drafts to sellers/brands behind those listings (X and email when findable); goal = convert free shelf → paid bid. Founder does not need personal contacts. Sending as founder requires connected channel or approval batch.
3. **Content (agent):** daily counter / #1 / new-bid post drafts; founder posts or grants X posting later.
4. **SEO (agent):** generate deal/category pages after board exists.
5. **Launch surfaces:** Show HN / PH / directories once any real $ is on the counter.
6. **No dependency** on friend seeding or “sellers you know.”

## 8. Non-goals (v1)

- Native mobile apps
- Creator affiliate accounts as primary ICP
- Complex analytics SaaS
- Paid ads
- Custom domain (until revenue)
- Binary options / gambling / dating boards

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Empty board | Free trending shelf + demo mode |
| Payment AUP | Stripe; clear rules; no NSFW |
| Clone wave | Speed + TikTok Shop-specific positioning |
| Cold outreach spam | Personalized, low volume, value-first; stop if channel blocks |
| $10k miss | Treat as sprint; public counter content is the growth loop |
| Token in chat | Rotate GitHub PAT after setup |

## 10. Acceptance criteria (MVP launch)

- [ ] Deployed on Vercel free URL
- [ ] Stripe test mode end-to-end (then live keys from user)
- [ ] Paid bid → webhook → rank update
- [ ] 10-day expiry enforced in active total
- [ ] Free trending shelf populated with ≥10 real TikTok Shop URLs
- [ ] Click tracking `/out/[id]`
- [ ] Admin hide
- [ ] Rules page documents pricing + expiry
- [ ] Outreach draft pipeline can produce copy for free-shelf listings

## 11. Open name

Working title **TikTokBid**. Final public name/domain chosen at launch (still free subdomain OK).
