# TikTokBid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a US TikTok Shop pay-to-rank board (outbid mechanic) on a free Vercel URL with Stripe Checkout, 10-day bid expiry, a free trending shelf, and scripts for discovery/outreach drafts.

**Architecture:** Next.js App Router; Turso via Prisma; Stripe Checkout + webhook as source of truth for paid bids; public board + `/out/[id]` click redirects; scripts for trending seed and outreach draft generation.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Prisma, `@libsql/client`, Stripe, Vitest, Vercel Hobby, Turso free tier.

---

## Global constraints

- Zero upfront: no custom domain day one, no paid DB/analytics.
- Min bid: `$2` (200 cents). Take #1 requires `+$2` over current #1 active total.
- Bid expires 10 days after successful payment.
- Free trending never outranks a paid listing with `activeTotalCents > 0`.
- Only TikTok Shop URL hosts (enforced in `lib/url.ts`).
- Repo root on box: `/workspace/tiktokbid`.

---

## File map

| Path | Role |
|---|---|
| `package.json` | scripts: `dev`, `build`, `start`, `test`, `db:push`, `seed:trending`, `outreach:draft` |
| `prisma/schema.prisma` | `Listing`, `Bid` |
| `src/lib/money.ts` | cents math, min bid, take-#1 delta, TTL |
| `src/lib/url.ts` | TikTok Shop URL normalize + allowlist |
| `src/lib/ranking.ts` | recompute active totals, board sort |
| `src/lib/db.ts` | Prisma client (local sqlite / Turso) |
| `src/lib/stripe.ts` | Stripe client |
| `src/app/page.tsx` | public board |
| `src/app/rules/page.tsx` | rules |
| `src/app/about/page.tsx` | about |
| `src/app/out/[id]/route.ts` | click ++ and 302 |
| `src/app/api/checkout/route.ts` | create Checkout Session |
| `src/app/api/webhook/stripe/route.ts` | record Bid on `checkout.session.completed` |
| `src/app/admin/page.tsx` | hide listings |
| `src/app/api/admin/hide/route.ts` | admin hide API |
| `src/components/Board.tsx` | paid + trending tables |
| `src/components/BidForm.tsx` | bid form |
| `src/components/StatsBar.tsx` | gross + #1 cost |
| `scripts/seed-trending.ts` | seed free shelf |
| `scripts/draft-outreach.ts` | markdown outreach drafts |
| `data/seed-products.json` | >=10 TikTok Shop URLs |
| `tests/money.test.ts` | money unit tests |
| `tests/url.test.ts` | URL unit tests |
| `tests/ranking.test.ts` | ranking unit tests |
| `.env.example` | env template |

---

### Task 1: Scaffold Next.js app

**Files:**
- Create: package.json, tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.mjs, vitest.config.ts
- Create: src/app/layout.tsx, src/app/globals.css, src/app/page.tsx
- Create: .env.example, .gitignore

- [ ] Init package with scripts listed above
- [ ] Add runtime deps: next, react, react-dom, stripe, prisma client, libsql client, prisma adapter-libsql, zod
- [ ] Add devDeps: typescript, tailwindcss, postcss, autoprefixer, prisma, vitest, tsx, node and react types
- [ ] Minimal page.tsx renders heading TikTokBid
- [ ] Production build succeeds
- [ ] Commit: chore: scaffold next tiktokbid

---

### Task 2: Prisma schema + db helper

**Files:**
- Create: prisma/schema.prisma
- Create: src/lib/db.ts

**Models:**
- Listing: id, url, urlKey unique, title, category optional, source paid or trending, activeTotalCents default 0, clickCount default 0, hidden default false, createdAt
- Bid: id, listingId, amountCents, stripeSessionId unique, createdAt, expiresAt

- [ ] Write schema with SQLite provider (Turso-compatible libsql URL at runtime)
- [ ] Implement getDb: local file sqlite when no Turso env; Turso adapter when TURSO_DATABASE_URL and auth token set
- [ ] Run prisma db push
- [ ] Commit: feat: add listing and bid schema

---

### Task 3: Money, URL, ranking (TDD)

**Files:**
- Create: src/lib/money.ts, src/lib/url.ts, src/lib/ranking.ts
- Create: tests/money.test.ts, tests/url.test.ts, tests/ranking.test.ts

**Exports (money):** MIN_BID_CENTS=200, TAKE_ONE_DELTA_CENTS=200, BID_TTL_MS for 10 days, dollarsToCents

**Exports (url):** normalizeTikTokShopUrl — allow only TikTok Shop hosts; strip tracking params; produce stable urlKey

**Exports (ranking):** recomputeActiveTotal, minCentsToTakeNumberOne, sortListingsForBoard

- [ ] Write failing tests: min bid 2 dollars; take number one needs plus 2 over current number one; expired bids excluded from active total; reject non TikTok Shop hosts; strip params; trending always below paid with activeTotal greater than 0
- [ ] Run tests — expect FAIL
- [ ] Implement libs until PASS
- [ ] Commit: feat: bidding math and tiktok url rules

---

### Task 4: Board UI

**Files:**
- Create: src/components/StatsBar.tsx, Board.tsx, BidForm.tsx
- Modify: src/app/page.tsx

- [ ] StatsBar: all-time gross = sum of all Bid amountCents; show number-one costs from ranking helper
- [ ] Board: paid table sorted then trending section
- [ ] BidForm: fields url, title, amount (>= 2); posts to /api/checkout
- [ ] Commit: feat: public board and bid form

---

### Task 5: Stripe Checkout + webhook

**Files:**
- Create: src/lib/stripe.ts
- Create: src/app/api/checkout/route.ts
- Create: src/app/api/webhook/stripe/route.ts

- [ ] POST /api/checkout: validate url + amount with money/url libs; create Checkout Session; return URL
- [ ] Webhook on checkout.session.completed: upsert Listing, create Bid with expiresAt = now + 10d, set source=paid, recompute activeTotalCents
- [ ] Idempotent on stripeSessionId
- [ ] Verify with Stripe CLI forward in test mode
- [ ] Commit: feat: stripe checkout and bid webhook

---

### Task 6: Out redirect, admin, rules

**Files:**
- Create: src/app/out/[id]/route.ts
- Create: src/app/admin/page.tsx, src/app/api/admin/hide/route.ts
- Create: src/app/rules/page.tsx, src/app/about/page.tsx

- [ ] GET /out/[id]: increment clickCount, 302 to listing URL
- [ ] Admin hide gated by ADMIN_PASSWORD
- [ ] Rules page documents 2 dollar min, plus 2 to take number one, 10-day expiry, trending shelf
- [ ] Commit: feat: out redirect admin and rules

---

### Task 7: Seed trending + outreach drafts

**Files:**
- Create: scripts/seed-trending.ts, scripts/draft-outreach.ts
- Create: data/seed-products.json (>=10 real TikTok Shop product URLs)

- [ ] Seed upserts listings with source=trending
- [ ] Outreach writes data/outreach/{id}.md personalized pitches inviting a 2 dollar bid (non-spam tone)
- [ ] Wire package scripts seed:trending and outreach:draft
- [ ] Commit: feat: trending seed and outreach drafts

---

### Task 8: Deploy to Vercel free URL

- [ ] Create GitHub repo tiktokbid under user account; push main
- [ ] Create Turso free DB; set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN on Vercel
- [ ] Deploy Vercel Hobby (*.vercel.app); set STRIPE secrets, ADMIN_PASSWORD, NEXT_PUBLIC_BASE_URL
- [ ] Configure Stripe webhook endpoint to /api/webhook/stripe
- [ ] User pastes live Stripe keys when ready (test first)
- [ ] README + complete .env.example
- [ ] Commit: docs: readme and env example for deploy

---

### Task 9: Post-deploy agent loop

- [ ] Run seed so 10+ trending listings visible on prod
- [ ] Generate outreach drafts for those listings
- [ ] Draft day-0 X launch thread (user posts)
- [ ] Optional: offer weekday routine to refresh discovery + outreach drafts

---

## Spec coverage checklist

| Spec rule | Tasks |
|---|---|
| 2 dollar min / plus 2 take number one / 10-day expiry | T3, T5 |
| Free trending shelf | T4, T7 |
| Stripe Checkout + webhook | T5 |
| Zero-upfront hosting/DB | T2, T8 |
| /out/[id] click tracking | T6 |
| Admin hide | T6 |
| Automated discovery/outreach | T7, T9 |
| US TikTok Shop only URLs | T3 |

---

## Execution notes

- Prefer subagent-driven-development (one task per worker, review between tasks).
- Do not implement until this plan is approved (or user says start).
- Stripe live keys: wait for user paste; never commit secrets.
- GitHub token was pasted in chat earlier — revoke/rotate after repo setup.

