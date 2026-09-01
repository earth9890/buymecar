import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { bids, type BidRow } from "@/db/schema";
import { SLOTS, SLOT_BY_ID } from "./slots-config";
import { goalCents, minBidCents } from "./pricing";
import type { SiteStats, SlotOwner, SlotView, SlotsPayload } from "./types";
import { isDodoConfigured } from "./dodo";

function toOwner(b: BidRow): SlotOwner {
  return {
    bidId: b.id,
    brandName: b.brandName,
    url: b.url,
    tagline: b.tagline,
    logoUrl: b.logoUrl,
    amountCents: b.amountCents,
    paidAt: b.paidAt ? b.paidAt.getTime() : b.createdAt.getTime(),
  };
}

/** The current (paid, highest) bid per slot. */
export async function getCurrentOwners(): Promise<Map<string, BidRow>> {
  await ensureDb();
  const rows = await db
    .select()
    .from(bids)
    .where(eq(bids.status, "paid"))
    .orderBy(desc(bids.amountCents), desc(bids.paidAt));
  const map = new Map<string, BidRow>();
  for (const r of rows) if (!map.has(r.slotId)) map.set(r.slotId, r);
  return map;
}

export async function getSlotViews(): Promise<SlotView[]> {
  const owners = await getCurrentOwners();
  return SLOTS.map((def) => {
    const o = owners.get(def.id) ?? null;
    return {
      ...def,
      owner: o ? toOwner(o) : null,
      minBidCents: minBidCents(def.startCents, o?.amountCents ?? null),
    };
  });
}

export async function getStats(): Promise<SiteStats> {
  await ensureDb();
  const [agg] = await db
    .select({
      raised: sql<number>`coalesce(sum(${bids.amountCents}), 0)`,
      paidCount: sql<number>`count(*)`,
    })
    .from(bids)
    .where(inArray(bids.status, ["paid", "outbid"]));
  const owners = await getCurrentOwners();
  const paidCount = Number(agg?.paidCount ?? 0);
  return {
    raisedCents: Number(agg?.raised ?? 0),
    goalCents: goalCents(),
    soldCount: owners.size,
    totalSlots: SLOTS.length,
    takeovers: Math.max(0, paidCount - owners.size),
  };
}

export async function getSlotsPayload(): Promise<SlotsPayload> {
  const [slots, stats] = await Promise.all([getSlotViews(), getStats()]);
  return { slots, stats, devMode: !isDodoConfigured() };
}

export async function getBid(id: string): Promise<BidRow | null> {
  await ensureDb();
  const [row] = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
  return row ?? null;
}

export async function getBidBySession(sessionId: string): Promise<BidRow | null> {
  await ensureDb();
  const [row] = await db
    .select()
    .from(bids)
    .where(eq(bids.checkoutSessionId, sessionId))
    .limit(1);
  return row ?? null;
}

export interface CreateBidInput {
  slotId: string;
  brandName: string;
  url: string;
  tagline?: string | null;
  logoUrl?: string | null;
  email: string;
  amountCents: number;
}

/** Validates the bid against the live floor and inserts it as `pending`. */
export async function createPendingBid(
  input: CreateBidInput,
  id: string,
): Promise<{ ok: true; bid: BidRow } | { ok: false; error: string; minBidCents: number }> {
  await ensureDb();
  const def = SLOT_BY_ID[input.slotId];
  if (!def) return { ok: false, error: "Unknown slot", minBidCents: 0 };
  const owners = await getCurrentOwners();
  const current = owners.get(def.id);
  const floor = minBidCents(def.startCents, current?.amountCents ?? null);
  if (input.amountCents < floor) {
    return { ok: false, error: "Bid is below the current minimum", minBidCents: floor };
  }
  const now = new Date();
  const row: BidRow = {
    id,
    slotId: def.id,
    brandName: input.brandName,
    url: input.url,
    tagline: input.tagline ?? null,
    logoUrl: input.logoUrl ?? null,
    email: input.email,
    amountCents: input.amountCents,
    status: "pending",
    provider: "dodo",
    checkoutSessionId: null,
    paymentId: null,
    createdAt: now,
    paidAt: null,
  };
  await db.insert(bids).values(row);
  return { ok: true, bid: row };
}

export async function attachCheckoutSession(bidId: string, sessionId: string) {
  await ensureDb();
  await db.update(bids).set({ checkoutSessionId: sessionId }).where(eq(bids.id, bidId));
}

/**
 * Marks a bid paid and demotes whoever it beat. Idempotent: a bid that is
 * already paid is a no-op, so replayed webhooks are harmless.
 */
export async function markBidPaid(bidId: string, paymentId: string | null): Promise<BidRow | null> {
  await ensureDb();
  const bid = await getBid(bidId);
  if (!bid) return null;
  if (bid.status === "paid") return bid;
  const now = new Date();
  await db
    .update(bids)
    .set({ status: "paid", paymentId, paidAt: now })
    .where(eq(bids.id, bidId));
  // Everyone else who was paid on this slot with a lower amount is now outbid.
  await db
    .update(bids)
    .set({ status: "outbid" })
    .where(
      and(
        eq(bids.slotId, bid.slotId),
        eq(bids.status, "paid"),
        sql`${bids.id} != ${bidId}`,
        sql`${bids.amountCents} <= ${bid.amountCents}`,
      ),
    );
  return { ...bid, status: "paid", paymentId, paidAt: now };
}

export async function markBidFailed(bidId: string) {
  await ensureDb();
  await db
    .update(bids)
    .set({ status: "failed" })
    .where(and(eq(bids.id, bidId), eq(bids.status, "pending")));
}
