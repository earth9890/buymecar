import type { SlotDef } from "./slots-config";

export interface SlotOwner {
  bidId: string;
  brandName: string;
  url: string;
  tagline: string | null;
  logoUrl: string | null;
  amountCents: number;
  paidAt: number;
  clicks: number;
}

export interface SlotView extends SlotDef {
  owner: SlotOwner | null;
  /** What it costs to take (or take over) this slot right now. */
  minBidCents: number;
}

export interface SiteStats {
  raisedCents: number;
  goalCents: number;
  soldCount: number;
  totalSlots: number;
  takeovers: number;
}

export interface ActivityItem {
  bidId: string;
  slotId: string;
  slotLabel: string;
  brandName: string;
  url: string;
  amountCents: number;
  paidAt: number;
  /** True when this bid replaced a previous paid holder. */
  takeover: boolean;
  /** Still the current holder of the slot. */
  current: boolean;
}

export interface SlotsPayload {
  slots: SlotView[];
  stats: SiteStats;
  activity: ActivityItem[];
  devMode: boolean;
}
