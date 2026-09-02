"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MousePointerClick } from "lucide-react";
import { formatUsd } from "@/lib/pricing";
import type { SlotsPayload } from "@/lib/types";
import { SiteHeader } from "./SiteHeader";
import { SlotDialog } from "./SlotDialog";
import { Toaster } from "@/components/ui/sonner";

const CarScene = dynamic(() => import("./car/CarScene").then((m) => m.CarScene), {
  ssr: false,
  loading: () => null,
});

const POLL_MS = 20_000;

export function BuyMeCarApp({ initial }: { initial: SlotsPayload }) {
  const [data, setData] = useState<SlotsPayload>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      /* offline; keep last good state */
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  const selected = useMemo(
    () => data.slots.find((s) => s.id === selectedId) ?? null,
    [data.slots, selectedId],
  );
  const hovered = useMemo(
    () => data.slots.find((s) => s.id === hoveredId) ?? null,
    [data.slots, hoveredId],
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#07080b]">
      <div className="absolute inset-0">
        <CarScene
          slots={data.slots}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          onHover={setHoveredId}
          onReady={onReady}
        />
      </div>

      {!ready && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#07080b]">
          <div className="flex items-center gap-3 rounded-xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground backdrop-blur">
            <Loader2 className="size-4 animate-spin" /> Rolling the G-Wagon out of the garage…
          </div>
        </div>
      )}

      <SiteHeader stats={data.stats} slots={data.slots} onPick={setSelectedId} />

      {/* hover HUD */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-3 sm:p-5">
        <div className="rounded-xl border bg-background/70 px-3 py-2 text-xs text-muted-foreground backdrop-blur sm:text-sm">
          {hovered ? (
            <span>
              <span className="font-semibold text-foreground">{hovered.label}</span>
              {hovered.owner ? (
                <> · held by <span className="text-foreground">{hovered.owner.brandName}</span> for {formatUsd(hovered.owner.amountCents)} · outbid from {formatUsd(hovered.minBidCents)}</>
              ) : (
                <> · available from {formatUsd(hovered.minBidCents)}</>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <MousePointerClick className="size-3.5" /> Drag to spin · click any panel to buy it
            </span>
          )}
        </div>
        <div className="hidden rounded-xl border bg-background/70 px-3 py-2 text-xs text-muted-foreground backdrop-blur sm:block">
          {data.devMode ? "Dev mode: payments are simulated" : "Secure checkout by Dodo Payments"}
          <span className="mx-1.5 opacity-50">·</span>
          <a href="https://sketchfab.com" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            3D model via Sketchfab
          </a>
        </div>
      </div>

      <SlotDialog slot={selected} devMode={data.devMode} onClose={() => setSelectedId(null)} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
