"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import type { ViewPreset } from "@/components/car/CarScene";
import { cn } from "@/lib/utils";

interface Props {
  active: ViewPreset | null;
  onPreset: (p: ViewPreset) => void;
  onZoom: (factor: number) => void;
}

const VIEWS: [ViewPreset, string][] = [
  ["front", "Front"],
  ["side", "Side"],
  ["rear", "Rear"],
  ["top", "Top"],
  ["inside", "Inside"],
];

export function ViewBar({ active, onPreset, onZoom }: Props) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#0b0d12]/80 p-1 backdrop-blur-md">
      {VIEWS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onPreset(key)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            active === key ? "bg-white text-black" : "text-muted-foreground hover:bg-white/[0.08] hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
      <span className="mx-1 h-4 w-px bg-white/10" />
      <button type="button" onClick={() => onZoom(1.3)} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/[0.08] hover:text-foreground" aria-label="Zoom out">
        <Minus className="size-3.5" />
      </button>
      <button type="button" onClick={() => onZoom(0.75)} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/[0.08] hover:text-foreground" aria-label="Zoom in">
        <Plus className="size-3.5" />
      </button>
      <button type="button" onClick={() => onPreset("hero")} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/[0.08] hover:text-foreground" aria-label="Reset view">
        <RotateCcw className="size-3.5" />
      </button>
    </div>
  );
}
