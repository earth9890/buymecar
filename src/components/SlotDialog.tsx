"use client";

import { useState } from "react";
import { ArrowUpRight, ExternalLink, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatUsd } from "@/lib/pricing";
import type { SlotView } from "@/lib/types";
import { brandColor, hostOf } from "@/components/car/materials";

interface Props {
  slot: SlotView | null;
  devMode: boolean;
  onClose: () => void;
}

const ZONE_LABEL: Record<SlotView["zone"], string> = {
  front: "Front",
  rear: "Rear",
  top: "Top",
  driver: "Driver side",
  passenger: "Passenger side",
};

export function SlotDialog({ slot, devMode, onClose }: Props) {
  if (!slot) return <Dialog open={false} />;
  // Keyed so the form state resets whenever the slot or its floor changes.
  return <SlotDialogInner key={`${slot.id}:${slot.minBidCents}`} slot={slot} devMode={devMode} onClose={onClose} />;
}

function SlotDialogInner({ slot, devMode, onClose }: Props & { slot: SlotView }) {
  const [brandName, setBrandName] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(() => String(slot.minBidCents / 100));
  const [submitting, setSubmitting] = useState(false);

  const owner = slot.owner;
  const minDollars = slot.minBidCents / 100;
  const amountCents = Math.round(Number(amount) * 100);
  const amountOk = Number.isFinite(amountCents) && amountCents >= slot.minBidCents;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amountOk) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          brandName,
          url,
          tagline,
          logoUrl,
          email,
          amountCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.minBidCents) {
          setAmount(String(data.minBidCents / 100));
          toast.error(`Someone moved first. Minimum is now ${formatUsd(data.minBidCents)}.`);
        } else {
          const issues = data.issues ? Object.values(data.issues).flat().join(" ") : "";
          toast.error(data.error ?? "Something went wrong", { description: issues || undefined });
        }
        return;
      }
      toast.success(data.devMode ? "Dev mode: simulating payment…" : "Redirecting to checkout…");
      window.location.assign(data.checkoutUrl);
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{ZONE_LABEL[slot.zone]}</Badge>
            {owner ? <Badge>Taken</Badge> : <Badge variant="secondary">Available</Badge>}
            {devMode && <Badge variant="destructive">Dev mode</Badge>}
          </div>
          <DialogTitle className="font-heading text-2xl">{slot.label}</DialogTitle>
          <DialogDescription>{slot.pitch}</DialogDescription>
        </DialogHeader>

        {owner && (
          <div
            className="flex items-center gap-3 rounded-lg border p-3"
            style={{ borderColor: brandColor(owner.brandName) }}
          >
            {owner.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={owner.logoUrl}
                alt=""
                className="size-12 rounded-md bg-white object-contain p-1"
              />
            ) : (
              <div
                className="flex size-12 items-center justify-center rounded-md text-lg font-bold text-white"
                style={{ background: brandColor(owner.brandName) }}
              >
                {owner.brandName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{owner.brandName}</div>
              <div className="truncate text-sm text-muted-foreground">
                {owner.tagline || hostOf(owner.url)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Paid</div>
              <div className="font-mono font-semibold">{formatUsd(owner.amountCents)}</div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              nativeButton={false}
              render={<a href={owner.url} target="_blank" rel="noopener noreferrer nofollow" />}
            >
              Visit <ExternalLink className="size-3.5" />
            </Button>
          </div>
        )}

        <Separator />

        <form onSubmit={submit} className="grid gap-3">
          <div className="flex items-baseline justify-between">
            <div className="font-semibold">
              {owner ? "Outbid them" : "Claim this spot"}
            </div>
            <div className="text-sm text-muted-foreground">
              min <span className="font-mono text-foreground">{formatUsd(slot.minBidCents)}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="brand">Brand name</Label>
              <Input id="brand" required maxLength={40} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Acme" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="url">Link (where clicks go)</Label>
              <Input id="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="acme.com" inputMode="url" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tagline">Tagline <span className="text-muted-foreground">(optional, shows on the car)</span></Label>
            <Input id="tagline" maxLength={60} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ship faster with Acme" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="logo">Logo URL <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" inputMode="url" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Your email (receipt)</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@acme.com" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Your price (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                min={minDollars}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 font-mono"
              />
            </div>
            {!amountOk && amount !== "" && (
              <p className="text-xs text-destructive">Must be at least {formatUsd(slot.minBidCents)}.</p>
            )}
          </div>

          <Button type="submit" size="lg" disabled={submitting || !amountOk} className="mt-1">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : owner ? <Zap className="size-4" /> : <ArrowUpRight className="size-4" />}
            {owner ? `Outbid for ${amountOk ? formatUsd(amountCents) : "…"}` : `Buy for ${amountOk ? formatUsd(amountCents) : "…"}`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Payment via Dodo Payments. You hold the spot until someone pays at least 20% more. No refunds when outbid, that&apos;s the game.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
