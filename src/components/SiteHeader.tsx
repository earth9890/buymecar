"use client";

import { Car, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/pricing";
import type { SiteStats } from "@/lib/types";

interface Props {
  stats: SiteStats;
  watching: number;
  onShare: () => void;
  onClaim: () => void;
}

const NAV = [
  ["#leaderboard", "Sponsors"],
  ["#spots", "Spots"],
  ["#activity", "Activity"],
  ["#how", "How it works"],
] as const;

export function SiteHeader({ stats, watching, onShare, onClaim }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07080b]/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-5">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gold text-gold-foreground">
            <Car className="size-4" />
          </span>
          <span className="font-heading text-[17px] font-bold tracking-tight">
            buymecar<span className="text-muted-foreground">.lol</span>
          </span>
        </a>

        <div className="hidden items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground sm:flex">
          <span className="live-dot size-1.5 rounded-full bg-emerald-400" />
          <span className="text-foreground">{watching} watching</span>
          <span className="opacity-40">·</span>
          <span>
            {stats.soldCount}/{stats.totalSlots} spots
          </span>
          <span className="opacity-40">·</span>
          <span>{formatUsd(stats.raisedCents)} raised</span>
        </div>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <Button variant="ghost" size="sm" onClick={onShare} aria-label="Share">
            <Share2 className="size-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button size="sm" onClick={onClaim} className="bg-gold text-gold-foreground hover:bg-gold/90">
            Claim a spot
          </Button>
        </div>
      </div>
    </header>
  );
}
