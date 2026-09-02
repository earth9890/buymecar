"use client";

import { Zap } from "lucide-react";
import { formatUsd } from "@/lib/pricing";
import { timeAgo } from "@/lib/format";
import type { ActivityItem } from "@/lib/types";
import { BrandAvatar } from "./BrandAvatar";

interface Props {
  items: ActivityItem[];
  onFocus: (id: string) => void;
}

export function ActivityFeed({ items, onFocus }: Props) {
  return (
    <section id="activity" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
      <div className="mb-6 flex items-center gap-2">
        <span className="live-dot size-2 rounded-full bg-emerald-400" />
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Latest activity</h2>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-muted-foreground">
          Quiet so far. First one on the car gets the story.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <button
              key={a.bidId}
              type="button"
              onClick={() => onFocus(a.slotId)}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.05]"
            >
              <BrandAvatar name={a.brandName} className="size-9 shrink-0 text-sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">
                  <span className="font-semibold">{a.brandName}</span>{" "}
                  <span className="text-muted-foreground">{a.takeover ? "took over the" : "claimed the"}</span>{" "}
                  <span className="font-medium">{a.slotLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-mono text-foreground/90">{formatUsd(a.amountCents)}</span>
                  <span>·</span>
                  <span>{timeAgo(a.paidAt)}</span>
                  {a.takeover && (
                    <span className="inline-flex items-center gap-0.5 text-gold">
                      <Zap className="size-3" /> takeover
                    </span>
                  )}
                  {!a.current && <span className="opacity-70">· since outbid</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
