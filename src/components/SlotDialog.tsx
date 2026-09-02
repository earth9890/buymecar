"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, ExternalLink, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsd } from "@/lib/pricing";
import { compactNumber, timeAgo } from "@/lib/format";
import { parseTarget } from "@/lib/target";
import type { SiteMeta } from "@/lib/preview";
import type { SlotView } from "@/lib/types";
import { hostOf } from "@/components/car/materials";
import { BrandAvatar } from "./BrandAvatar";
import { PriceStepper } from "./PriceStepper";
import { showroom } from "@/lib/sound";

export interface ClaimDraft {
  target: string;
  amountCents?: number;
}

interface Props {
  slot: SlotView | null;
  devMode: boolean;
  /** Pre-filled from the hero claim bar; jumps straight to the confirm step. */
  draft?: ClaimDraft | null;
  onClose: () => void;
}

const ZONE_LABEL: Record<SlotView["zone"], string> = {
  front: "Front",
  rear: "Rear",
  top: "Top",
  driver: "Driver side",
  passenger: "Passenger side",
  wheels: "Wheels",
  interior: "Interior",
};

export function SlotDialog({ slot, devMode, draft, onClose }: Props) {
  if (!slot) return <Dialog open={false} />;
  return <SlotDialogInner key={`${slot.id}:${slot.minBidCents}:${draft?.target ?? ""}`} slot={slot} devMode={devMode} draft={draft} onClose={onClose} />;
}

function SlotDialogInner({ slot, devMode, draft, onClose }: Props & { slot: SlotView }) {
  const [step, setStep] = useState<"form" | "confirm">(draft?.target ? "confirm" : "form");
  const [target, setTarget] = useState(draft?.target ?? "");
  const [amount, setAmount] = useState(Math.max(slot.minBidCents, draft?.amountCents ?? slot.minBidCents));
  const [meta, setMeta] = useState<SiteMeta | null>(null);
  const [metaFor, setMetaFor] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [details, setDetails] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsed = parseTarget(target);
  const owner = slot.owner;

  // Unfurl the link whenever we land on the confirm step.
  const loadingMeta = step === "confirm" && Boolean(parsed) && metaFor !== target;
  useEffect(() => {
    if (step !== "confirm" || !parsed || metaFor === target) return;
    let cancelled = false;
    fetch(`/api/preview?q=${encodeURIComponent(target)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m: SiteMeta | null) => {
        if (cancelled) return;
        setMeta(m);
        setMetaFor(target);
        if (m) {
          setBrandName((v) => v || m.title);
          setTagline((v) => v || m.description || "");
          setLogoUrl((v) => v || m.image || "");
        }
      })
      .catch(() => !cancelled && setMetaFor(target));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, target, metaFor]);

  function goConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed) {
      toast.error("Enter your product URL or an @handle");
      return;
    }
    setStep("confirm");
  }

  async function checkout() {
    if (!parsed || !agreed) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, target, amountCents: amount, brandName, tagline, logoUrl, agreed: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.minBidCents) {
          setAmount(data.minBidCents);
          toast.error(`Someone moved first. It's ${formatUsd(data.minBidCents)} now.`);
        } else {
          toast.error(data.error ?? "Something went wrong");
        }
        return;
      }
      showroom?.chime();
      toast.success(data.devMode ? "Dev mode: simulating payment…" : "Taking you to checkout…");
      window.location.assign(data.checkoutUrl);
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const previewName = brandName || meta?.title || parsed?.name || "";
  const previewSub = tagline || meta?.description || parsed?.host || "";
  const previewLogo = logoUrl || meta?.image || parsed?.logoUrl || null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{ZONE_LABEL[slot.zone]}</Badge>
            {owner ? <Badge>Taken</Badge> : <Badge variant="secondary">Open</Badge>}
            {devMode && <Badge variant="destructive">Dev mode</Badge>}
          </div>
          <DialogTitle className="font-heading text-2xl">
            {step === "confirm" ? (owner ? `Take over the ${slot.label}` : `Claim the ${slot.label}`) : slot.label}
          </DialogTitle>
          <DialogDescription>
            {step === "confirm" ? "Check the panel and price, agree to the rules, then pay." : slot.pitch}
          </DialogDescription>
        </DialogHeader>

        {owner && step === "form" && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <BrandAvatar name={owner.brandName} logoUrl={owner.logoUrl} className="size-11 text-lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{owner.brandName}</div>
              <div className="truncate text-sm text-muted-foreground">{owner.tagline || hostOf(owner.url)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {compactNumber(owner.clicks)} clicks · {timeAgo(owner.paidAt)}
              </div>
              <div className="font-mono font-semibold">{formatUsd(owner.amountCents)}</div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              nativeButton={false}
              render={<a href={`/go/${slot.id}`} target="_blank" rel="noopener noreferrer nofollow sponsored" />}
            >
              Visit <ExternalLink className="size-3.5" />
            </Button>
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={goConfirm} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="target">Your product URL or @handle</Label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="target"
                  autoFocus
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="acme.com or @acme"
                  className="h-11 pl-9"
                  inputMode="url"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                That&apos;s where clicks on your panel go. Name, tagline and logo are pulled from the page. You can edit them next.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm">
                <div className="font-medium">{owner ? "Your takeover price" : "Your price"}</div>
                <div className="text-xs text-muted-foreground">
                  {owner ? `At least 20% over ${owner.brandName}` : "Opening price. Pay more to be harder to outbid."}
                </div>
              </div>
              <PriceStepper valueCents={amount} minCents={slot.minBidCents} onChange={setAmount} />
            </div>
            <Button type="submit" size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
              {owner ? "Take it" : "Claim it"} for {formatUsd(amount)} <ArrowRight className="size-4" />
            </Button>
          </form>
        ) : (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Panel</div>
                <div className="font-heading text-xl font-bold">{slot.label}</div>
                <div className="text-xs text-muted-foreground">{ZONE_LABEL[slot.zone]}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price</div>
                <div className="font-heading text-xl font-bold text-gold">{formatUsd(amount)}</div>
                <div className="text-xs text-muted-foreground">Due now</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
              {loadingMeta ? (
                <div className="flex size-11 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <BrandAvatar name={previewName || "?"} logoUrl={previewLogo} className="size-11 text-lg" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{previewName || "…"}</div>
                <div className="truncate text-sm text-muted-foreground">{previewSub}</div>
                <div className="truncate text-xs text-muted-foreground/70">{parsed?.url}</div>
              </div>
              <button type="button" onClick={() => setStep("form")} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                Change
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDetails((d) => !d)}
              className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={`size-3.5 transition-transform ${details ? "rotate-180" : ""}`} /> Edit name, tagline or logo
            </button>
            {details && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="brand">Name on the car</Label>
                  <Input id="brand" maxLength={40} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder={parsed?.name} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input id="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" maxLength={60} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line under your name" />
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Your panel goes live the moment payment confirms. Anyone can take it from you by paying at least 20% more, and being outbid is not a refund.
            </p>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3 text-sm">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-4 accent-[#f2b544]" />
              <span>
                I agree to the{" "}
                <a href="#how" onClick={onClose} className="underline underline-offset-2">
                  rules
                </a>
                : clean content, honest link, no refund when outbid.
              </span>
            </label>

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button size="lg" disabled={!agreed || submitting} onClick={checkout} className="bg-gold text-gold-foreground hover:bg-gold/90">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Continue to checkout · {formatUsd(amount)}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Card, Apple Pay and Google Pay via Dodo Payments. Your email is collected at checkout.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
