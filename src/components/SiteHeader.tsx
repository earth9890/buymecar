"use client";

import { Car } from "lucide-react";
import { formatUsd } from "@/lib/pricing";
import type { SiteStats, SlotView } from "@/lib/types";
import { HowItWorks } from "./HowItWorks";
import { Leaderboard } from "./Leaderboard";

interface Props {
  stats: SiteStats;
  slots: SlotView[];
  onPick: (id: string) => void;
}

export function SiteHeader({ stats, slots, onPick }: Props) {
  const pct = Math.min(100, (stats.raisedCents / stats.goalCents) * 100);
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-5">
      <div className="pointer-events-auto mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Car className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-lg leading-none font-bold tracking-tight sm:text-xl">
              buymecar<span className="text-muted-foreground">.lol</span>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Put your brand on my future G63. Highest payer keeps the panel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden min-w-56 rounded-xl border bg-background/70 p-3 backdrop-blur md:block">
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span>Raised</span>
              <span>{stats.soldCount}/{stats.totalSlots} spots · {stats.takeovers} takeovers</span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="font-mono text-lg font-semibold">{formatUsd(stats.raisedCents)}</span>
              <span className="text-xs text-muted-foreground">of {formatUsd(stats.goalCents, { compact: true })}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${Math.max(pct, 0.5)}%` }} />
            </div>
          </div>
          <HowItWorks />
          <Leaderboard slots={slots} onPick={onPick} />
        </div>
      </div>
    </header>
  );
}
