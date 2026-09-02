# buymecar.lol

A 3D Mercedes-AMG G63 covered in sponsor panels. Brands buy a panel, their name goes on the car and every click on that panel opens their link. Anyone can take a panel over by paying at least 20% more. When the goal is reached, the real car gets bought and wrapped exactly like the page.

Inspired by [outbid.lol](https://outbid.lol/), but for a car.

## Stack

- **Next.js 16** (App Router, Turbopack), TypeScript, Tailwind v4
- **shadcn/ui** (base-nova style on Base UI) for dialogs, sheets, tables, toasts
- **Three.js** via `@react-three/fiber` + `@react-three/drei`. The G-Wagon is procedural (boxes and cylinders), so there is no asset licensing issue and it loads instantly. Drop a GLB at `public/models/gwagon.glb` and set `NEXT_PUBLIC_CAR_MODEL_URL` to swap it in later.
- **Drizzle ORM + libsql** (SQLite file locally, Turso-ready in prod). Tables are auto-created and slots auto-seeded on first request. No migration step needed.
- **Dodo Payments** for checkout + webhooks. Without credentials the app runs in **dev mode** and simulates payments.

## Run it

```bash
pnpm install
cp .env.example .env.local   # already done in this repo
pnpm dev
```

Open http://localhost:3000, click any glowing panel, fill in the form, click Buy. In dev mode you are redirected through `/api/dev/complete`, which marks the bid paid and sends you to `/success`.

## How the money logic works

- Each slot has an opening price (`src/lib/slots-config.ts`).
- A bid is stored as `pending`, then becomes `paid` when the payment provider confirms. The paid bid with the highest amount owns the slot.
- Minimum to take over a slot: `max(current × 1.2, current + $10, opening price)` (`src/lib/pricing.ts`).
- When a new bid is paid, every lower paid bid on that slot is flipped to `outbid`. Nobody gets refunded; that is the game.
- Total raised counts every paid bid, including ones later outbid.

## Dodo Payments integration

Everything is wired; it only needs credentials. Step-by-step dashboard guide with test cards: [DODO_SETUP.md](./DODO_SETUP.md).

1. In the Dodo dashboard create a **one-time, pay-what-you-want** product. Copy its id into `DODO_PRODUCT_ID`. Every purchase charges this product with a fixed `amount` (in cents) equal to the bid.
2. Create an API key → `DODO_PAYMENTS_API_KEY`. Set `DODO_PAYMENTS_ENVIRONMENT=test_mode` until you go live.
3. Add a webhook pointing at `https://<your-domain>/api/webhooks/dodo`, subscribe to `payment.succeeded`, `payment.failed` and `payment.cancelled`, copy the signing secret into `DODO_PAYMENTS_WEBHOOK_KEY`.
4. Set `NEXT_PUBLIC_SITE_URL` to your public URL so the checkout `return_url` and dev redirects are correct.

Flow: `POST /api/checkout` validates the bid against the live floor, inserts a pending bid, calls `checkoutSessions.create` with `metadata.bid_id`, and returns the hosted `checkout_url`. The webhook verifies the signature with the SDK's `webhooks.unwrap`, reads `bid_id` from metadata (falls back to `checkout_session_id`), and calls `markBidPaid`, which is idempotent so replays are safe.

`/api/dev/complete` refuses to run once Dodo is configured, so it cannot be abused in production.

## Routes

| Route | What |
| --- | --- |
| `/` | The car. Server-rendered slot state, client polls `/api/slots` every 20s. |
| `/success?bid=…` | Post-checkout page. Auto-refreshes while the webhook is pending. |
| `GET /api/slots` | All slots with current owner and min bid, plus stats. |
| `POST /api/checkout` | Create a bid + checkout session. |
| `POST /api/webhooks/dodo` | Dodo webhook receiver. |
| `GET /api/dev/complete?bid=…` | Dev-mode fake payment. Disabled when Dodo is configured. |

## Deploying

Works on Vercel or any Node host. For production swap `DATABASE_URL` to a Turso URL (`libsql://…`) plus `DATABASE_AUTH_TOKEN`; the SQLite file is only for local dev because serverless filesystems are ephemeral.

## Tests

```bash
pnpm test   # vitest: pricing rules + full bid lifecycle on a temp SQLite file
```

## TODO

- Paste real Dodo credentials + end-to-end test in test mode (see DODO_SETUP.md)
- Admin page to remove abusive sponsors / refund
- Upload the real G63 GLB and align slot positions to it
- OG image generator showing the current car
- Rate limiting on `/api/checkout`
