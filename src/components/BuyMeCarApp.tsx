"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Loader2, MousePointerClick, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { formatUsd } from "@/lib/pricing";
import type { SlotsPayload } from "@/lib/types";
import type { CameraCommand, ViewPreset } from "./car/CarScene";
import { SiteHeader } from "./SiteHeader";
import { SlotDialog } from "./SlotDialog";
import { ViewBar } from "./ViewBar";
import { Leaderboard } from "./Leaderboard";
import { AvailableGrid } from "./AvailableGrid";
import { ActivityFeed } from "./ActivityFeed";
import { HowItWorks } from "./HowItWorks";
import { SiteFooter } from "./SiteFooter";
import { BrandAvatar } from "./BrandAvatar";

const CarScene = dynamic(() => import("./car/CarScene").then((m) => m.CarScene), { ssr: false, loading: () => null });

const POLL_MS = 15_000;

export function BuyMeCarApp({ initial }: { initial: SlotsPayload }) {
  const [data, setData] = useState<SlotsPayload>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [command, setCommand] = useState<CameraCommand | null>(null);
  const [activePreset, setActivePreset] = useState<ViewPreset | null>("hero");
  const [wheelZoom, setWheelZoom] = useState(false);
  const [watching, setWatching] = useState(1);
  const nonce = useRef(0);
  const heroRef = useRef<HTMLElement>(null);
  const lastActivity = useRef<string | null>(initial.activity[0]?.bidId ?? null);

  const onReady = useCallback(() => setReady(true), []);

  // ---- live data ----
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      if (!res.ok) return;
      const next: SlotsPayload = await res.json();
      setData(next);
      const newest = next.activity[0];
      if (newest && newest.bidId !== lastActivity.current) {
        lastActivity.current = newest.bidId;
        toast(`${newest.brandName} ${newest.takeover ? "took over" : "claimed"} the ${newest.slotLabel}`, {
          description: `${formatUsd(newest.amountCents)} · outbid them for ${formatUsd(
            next.slots.find((s) => s.id === newest.slotId)?.minBidCents ?? 0,
          )}`,
          icon: <Trophy className="size-4 text-gold" />,
        });
      }
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

  // ---- presence ----
  useEffect(() => {
    let pid = "";
    try {
      pid = sessionStorage.getItem("bmc_pid") ?? "";
      if (!pid) {
        pid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("bmc_pid", pid);
      }
    } catch {
      pid = Math.random().toString(36).slice(2);
    }
    const beat = async () => {
      try {
        const res = await fetch("/api/presence", { method: "POST", body: JSON.stringify({ id: pid }), headers: { "Content-Type": "application/json" } });
        if (res.ok) setWatching((await res.json()).watching);
      } catch {
        /* ignore */
      }
    };
    beat();
    const id = setInterval(beat, 25_000);
    return () => clearInterval(id);
  }, []);

  // Wheel zoom only after the visitor engages with the car, so the page still scrolls.
  useEffect(() => {
    const disengage = () => setWheelZoom(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && disengage();
    window.addEventListener("scroll", disengage, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", disengage);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // ---- camera ----
  const send = useCallback((c: Omit<CameraCommand, "nonce">) => {
    nonce.current += 1;
    setCommand({ ...c, nonce: nonce.current });
  }, []);
  const onPreset = useCallback(
    (p: ViewPreset) => {
      setActivePreset(p);
      send({ type: "preset", preset: p });
    },
    [send],
  );
  const onZoom = useCallback((factor: number) => send({ type: "zoom", factor }), [send]);
  const focusSlot = useCallback(
    (id: string) => {
      setActivePreset(null);
      heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      send({ type: "focus", slotId: id });
    },
    [send],
  );
  const pickSlot = useCallback(
    (id: string) => {
      focusSlot(id);
      // Let the flight start before the dialog covers it.
      window.setTimeout(() => setSelectedId(id), 350);
    },
    [focusSlot],
  );

  const onShare = useCallback(async () => {
    const url = window.location.origin;
    const text = `Put your brand on a real Mercedes-AMG G63. Highest payer keeps the panel. ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "buymecar.lol", text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      /* cancelled */
    }
  }, []);

  const selected = useMemo(() => data.slots.find((s) => s.id === selectedId) ?? null, [data.slots, selectedId]);
  const hovered = useMemo(
    () => data.slots.find((s) => s.id === (hoveredId ?? highlightId)) ?? null,
    [data.slots, hoveredId, highlightId],
  );
  const hood = data.slots.find((s) => s.id === "hood");
  const top = useMemo(
    () => data.slots.filter((s) => s.owner).sort((a, b) => b.owner!.amountCents - a.owner!.amountCents)[0] ?? null,
    [data.slots],
  );
  const pct = Math.min(100, (data.stats.raisedCents / data.stats.goalCents) * 100);

  return (
    <div id="top" className="min-h-dvh bg-[#07080b] text-foreground">
      <SiteHeader
        stats={data.stats}
        watching={watching}
        onShare={onShare}
        onClaim={() => document.getElementById("spots")?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* ================= HERO ================= */}
      <section ref={heroRef} className="relative h-[calc(100dvh-3.5rem)] min-h-[600px] w-full overflow-hidden scroll-mt-14">
        <div className="absolute inset-0" onPointerDown={() => setWheelZoom(true)}>
          <CarScene
            slots={data.slots}
            selectedId={selectedId}
            highlightId={highlightId}
            command={command}
            wheelZoom={wheelZoom}
            onSelect={(id) => setSelectedId(id)}
            onHover={setHoveredId}
            onReady={onReady}
            onInteract={() => setActivePreset(null)}
          />
        </div>

        {!ready && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#07080b]">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Rolling the G63 out of the garage…
            </div>
          </div>
        )}

        {/* hover HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
          <div
            className={`rounded-full border border-white/[0.08] bg-[#0b0d12]/80 px-4 py-1.5 text-sm backdrop-blur-md transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}
          >
            {hovered && (
              <span>
                <span className="font-semibold">{hovered.label}</span>
                {hovered.owner ? (
                  <>
                    {" "}
                    <span className="text-muted-foreground">held by</span> {hovered.owner.brandName}{" "}
                    <span className="text-muted-foreground">for</span> {formatUsd(hovered.owner.amountCents)}{" "}
                    <span className="text-muted-foreground">· take it for</span> <span className="text-gold">{formatUsd(hovered.minBidCents)}</span>
                  </>
                ) : (
                  <>
                    {" "}
                    <span className="text-muted-foreground">· open at</span> <span className="text-gold">{formatUsd(hovered.minBidCents)}</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* bottom overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#07080b] via-[#07080b]/60 to-transparent pb-5 pt-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="pointer-events-auto max-w-xl">
              <h1 className="font-heading text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
                Your brand on my <span className="text-gold">future G63</span>.
              </h1>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
                {data.slots.length} panels on a real Mercedes-AMG G63. Highest payer keeps the panel, every click on it goes to your link,
                and anyone can outbid you for 20% more. When it&apos;s funded, I buy the car and wrap it exactly like this.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {hood && (
                  <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => pickSlot("hood")}>
                    {hood.owner ? "Take the hood" : "Claim the hood"} · {formatUsd(hood.minBidCents)}
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/15 bg-white/[0.03] hover:bg-white/[0.08]"
                  onClick={() => document.getElementById("spots")?.scrollIntoView({ behavior: "smooth" })}
                >
                  All {data.slots.length} spots <ArrowDown className="size-4" />
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MousePointerClick className="size-3.5" />
                {wheelZoom ? "Scroll to zoom · Esc to release" : "Drag to spin · click the car to zoom with your wheel · click a price to buy"}
              </div>
            </div>

            <div className="pointer-events-auto flex flex-col gap-3 lg:items-end">
              <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0b0d12]/80 p-4 backdrop-blur-md lg:w-80">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Raised toward the car</span>
                  <span className="text-xs text-muted-foreground">{pct.toFixed(pct < 10 ? 2 : 1)}%</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-heading text-2xl font-bold tabular-nums">{formatUsd(data.stats.raisedCents)}</span>
                  <span className="text-sm text-muted-foreground">of {formatUsd(data.stats.goalCents, { compact: true })}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${Math.max(pct, 0.6)}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {data.stats.soldCount}/{data.stats.totalSlots} spots · {data.stats.takeovers} takeovers
                  </span>
                  {top && (
                    <span className="inline-flex items-center gap-1.5">
                      <Trophy className="size-3 text-gold" />
                      <BrandAvatar name={top.owner!.brandName} logoUrl={top.owner!.logoUrl} className="size-4 rounded text-[9px]" />
                      <span className="text-foreground">{top.owner!.brandName}</span>
                    </span>
                  )}
                </div>
              </div>
              <ViewBar active={activePreset} onPreset={onPreset} onZoom={onZoom} />
            </div>
          </div>
        </div>
      </section>

      <Leaderboard slots={data.slots} onFocus={focusSlot} onPick={pickSlot} onHighlight={setHighlightId} />
      <AvailableGrid slots={data.slots} onPick={pickSlot} onHighlight={setHighlightId} />
      <ActivityFeed items={data.activity} onFocus={focusSlot} />
      <HowItWorks />
      <SiteFooter devMode={data.devMode} />

      <SlotDialog slot={selected} devMode={data.devMode} onClose={() => setSelectedId(null)} />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
