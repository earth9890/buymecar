"use client";

import { ArrowUpRight, ExternalLink, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/pricing";
import { timeAgo, compactNumber } from "@/lib/format";
import type { SlotView } from "@/lib/types";
import { hostOf } from "@/components/car/materials";
import { BrandAvatar } from "./BrandAvatar";
import { cn } from "@/lib/utils";

interface Props {
  slots: SlotView[];
  onFocus: (id: string) => void;
  onPick: (id: string) => void;
  onHighlight: (id: string | null) => void;
}

export function Leaderboard({ slots, onFocus, onPick, onHighlight }: Props) {
  const owned = slots
    .filter((s) => s.owner)
    .sort((a, b) => b.owner!.amountCents - a.owner!.amountCents || a.owner!.paidAt - b.owner!.paidAt);

  return (
    <section id="leaderboard" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Who&apos;s on the car</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by what they paid. Every one of them can be taken over for 20% more.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {owned.length} of {slots.length} panels sponsored
        </div>
      </div>

      {owned.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-muted-foreground">
          Nobody yet. The hood is wide open at {formatUsd(slots.find((s) => s.id === "hood")?.minBidCents ?? 0)}.
        </div>
      ) : (
        <ol className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {owned.map((s, i) => {
            const o = s.owner!;
            const top = i === 0;
            return (
              <li
                key={s.id}
                className={cn(
                  "group flex cursor-pointer items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.04] sm:px-5",
                  top && "bg-gold/[0.06]",
                )}
                onMouseEnter={() => onHighlight(s.id)}
                onMouseLeave={() => onHighlight(null)}
                onClick={() => onFocus(s.id)}
              >
                <div className={cn("w-9 shrink-0 font-heading text-lg font-bold tabular-nums", top ? "text-gold" : "text-muted-foreground")}>
                  #{i + 1}
                </div>
                <BrandAvatar name={o.brandName} logoUrl={o.logoUrl} className="size-11 shrink-0 text-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/go/${s.id}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      onClick={(e) => e.stopPropagation()}
                      className="truncate font-semibold hover:underline"
                    >
                      {o.brandName}
                    </a>
                    <ExternalLink className="size-3.5 shrink-0 opacity-40" />
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{o.tagline || hostOf(o.url)}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground/80">
                    <span className="font-medium text-foreground/80">{s.label}</span>
                    <span>·</span>
                    <span>{hostOf(o.url)}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MousePointerClick className="size-3" /> {compactNumber(o.clicks)} clicks
                    </span>
                    <span>·</span>
                    <span>{timeAgo(o.paidAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("font-heading text-lg font-bold tabular-nums", top ? "text-gold" : "")}>{formatUsd(o.amountCents)}</div>
                  <div className="text-xs text-muted-foreground">outbid from {formatUsd(s.minBidCents)}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden shrink-0 sm:inline-flex"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPick(s.id);
                  }}
                >
                  Outbid <ArrowUpRight className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
