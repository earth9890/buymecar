"use client";

import { Minus, Plus } from "lucide-react";
import { formatUsd } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface Props {
  valueCents: number;
  minCents: number;
  onChange: (cents: number) => void;
  size?: "md" | "lg";
  className?: string;
}

/** Step size grows with the price so the buttons stay useful at any level. */
export function stepFor(cents: number): number {
  if (cents < 20000) return 1000;
  if (cents < 100000) return 2500;
  if (cents < 500000) return 5000;
  return 10000;
}

export function PriceStepper({ valueCents, minCents, onChange, size = "md", className }: Props) {
  const step = stepFor(valueCents);
  const dec = () => onChange(Math.max(minCents, valueCents - step));
  const inc = () => onChange(valueCents + step);
  const big = size === "lg";
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={dec}
        disabled={valueCents <= minCents}
        aria-label="Lower price"
        className={cn(
          "flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.1] hover:text-foreground disabled:opacity-30",
          big ? "size-8" : "size-7",
        )}
      >
        <Minus className={big ? "size-4" : "size-3.5"} />
      </button>
      <span className={cn("min-w-[5ch] text-center font-heading font-bold tabular-nums text-gold", big ? "text-3xl" : "text-xl")}>
        {formatUsd(valueCents)}
      </span>
      <button
        type="button"
        onClick={inc}
        aria-label="Raise price"
        className={cn(
          "flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.1] hover:text-foreground",
          big ? "size-8" : "size-7",
        )}
      >
        <Plus className={big ? "size-4" : "size-3.5"} />
      </button>
    </div>
  );
}
