import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { bids, type BidRow } from "@/db/schema";
import { SLOTS, SLOT_BY_ID } from "./slots-config";
import { goalCents, minBidCents } from "./pricing";
import type { ActivityItem, SiteStats, SlotOwner, SlotView, SlotsPayload } from "./types";
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
    clicks: b.clicks,
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

/** Latest paid bids, newest first. */
export async function getActivity(limit = 20): Promise<ActivityItem[]> {
  await ensureDb();
  const rows = await db
    .select()
    .from(bids)
    .where(inArray(bids.status, ["paid", "outbid"]))
    .orderBy(desc(bids.paidAt))
    .limit(limit * 3);
  // A bid is a takeover if an earlier paid bid existed on the same slot.
  const all = await db
    .select({ id: bids.id, slotId: bids.slotId, paidAt: bids.paidAt })
    .from(bids)
    .where(inArray(bids.status, ["paid", "outbid"]));
  const firstPaid = new Map<string, number>();
  for (const b of all) {
    const t = b.paidAt?.getTime() ?? 0;
    const cur = firstPaid.get(b.slotId);
    if (cur === undefined || t < cur) firstPaid.set(b.slotId, t);
  }
  return rows.slice(0, limit).map((b) => {
    const t = b.paidAt?.getTime() ?? b.createdAt.getTime();
    return {
      bidId: b.id,
      slotId: b.slotId,
      slotLabel: SLOT_BY_ID[b.slotId]?.label ?? b.slotId,
      brandName: b.brandName,
      url: b.url,
      amountCents: b.amountCents,
      paidAt: t,
      takeover: (firstPaid.get(b.slotId) ?? t) < t,
      current: b.status === "paid",
    };
  });
}

/** Counts a click-through on an owned slot and returns the destination URL. */
export async function recordClick(slotId: string): Promise<string | null> {
  const owners = await getCurrentOwners();
  const owner = owners.get(slotId);
  if (!owner) return null;
  await db
    .update(bids)
    .set({ clicks: sql`${bids.clicks} + 1` })
    .where(eq(bids.id, owner.id));
  return owner.url;
}

export async function getSlotsPayload(): Promise<SlotsPayload> {
  const [slots, stats, activity] = await Promise.all([getSlotViews(), getStats(), getActivity(12)]);
  return { slots, stats, activity, devMode: !isDodoConfigured() };
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
    clicks: 0,
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

export async function setBidEmail(bidId: string, email: string) {
  await ensureDb();
  await db.update(bids).set({ email }).where(eq(bids.id, bidId));
}

export async function markBidFailed(bidId: string) {
  await ensureDb();
  await db
    .update(bids)
    .set({ status: "failed" })
    .where(and(eq(bids.id, bidId), eq(bids.status, "pending")));
}
