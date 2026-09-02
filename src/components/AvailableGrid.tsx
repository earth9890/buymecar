"use client";

import { formatUsd } from "@/lib/pricing";
import type { SlotView } from "@/lib/types";
import type { SlotZone } from "@/lib/slots-config";
import { cn } from "@/lib/utils";

interface Props {
  slots: SlotView[];
  onPick: (id: string) => void;
  onHighlight: (id: string | null) => void;
}

const ZONES: [SlotZone, string][] = [
  ["top", "Hood & roof"],
  ["front", "Front"],
  ["passenger", "Passenger side"],
  ["driver", "Driver side"],
  ["rear", "Rear"],
  ["wheels", "Wheels"],
  ["interior", "Interior"],
];

export function AvailableGrid({ slots, onPick, onHighlight }: Props) {
  return (
    <section id="spots" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Every panel on the car</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {slots.length} spots. Price shown is what it costs right now: opening price if it&apos;s free, 20% over the holder if it&apos;s taken.
        </p>
      </div>
      <div className="grid gap-8">
        {ZONES.map(([zone, title]) => {
          const list = slots.filter((s) => s.zone === zone).sort((a, b) => b.minBidCents - a.minBidCents);
          if (list.length === 0) return null;
          return (
            <div key={zone}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((s) => {
                  const taken = Boolean(s.owner);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onPick(s.id)}
                      onMouseEnter={() => onHighlight(s.id)}
                      onMouseLeave={() => onHighlight(null)}
                      className={cn(
                        "group flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]",
                        taken ? "border-white/[0.06] bg-white/[0.02]" : "border-white/[0.08] bg-white/[0.03]",
                      )}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-tight">{s.label}</span>
                        <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", taken ? "bg-white/[0.08] text-muted-foreground" : "bg-emerald-500/15 text-emerald-300")}>
                          {taken ? "Taken" : "Open"}
                        </span>
                      </div>
                      <div className="mt-auto w-full">
                        <div className="font-heading text-xl font-bold tabular-nums text-gold">{formatUsd(s.minBidCents)}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {taken ? `held by ${s.owner!.brandName}` : s.pitch}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
