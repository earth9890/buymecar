import type { SlotDef } from "./slots-config";

export interface SlotOwner {
  bidId: string;
  brandName: string;
  url: string;
  tagline: string | null;
  logoUrl: string | null;
  amountCents: number;
  paidAt: number;
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

export interface SlotsPayload {
  slots: SlotView[];
  stats: SiteStats;
  devMode: boolean;
}
