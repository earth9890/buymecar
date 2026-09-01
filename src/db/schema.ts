import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const slots = sqliteTable("slots", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  startCents: integer("start_cents").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const bids = sqliteTable("bids", {
  id: text("id").primaryKey(),
  slotId: text("slot_id").notNull(),
  brandName: text("brand_name").notNull(),
  url: text("url").notNull(),
  tagline: text("tagline"),
  logoUrl: text("logo_url"),
  email: text("email").notNull(),
  amountCents: integer("amount_cents").notNull(),
  // pending -> paid -> outbid | failed
  status: text("status").notNull().default("pending"),
  provider: text("provider").notNull().default("dodo"),
  checkoutSessionId: text("checkout_session_id"),
  paymentId: text("payment_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
});

export type SlotRow = typeof slots.$inferSelect;
export type BidRow = typeof bids.$inferSelect;
export type BidStatus = "pending" | "paid" | "outbid" | "failed";
