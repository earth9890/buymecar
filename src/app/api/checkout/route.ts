import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { attachCheckoutSession, createPendingBid, markBidFailed } from "@/lib/repo";
import { createDodoCheckout, isDodoConfigured, siteUrl } from "@/lib/dodo";
import { SLOT_BY_ID } from "@/lib/slots-config";
import { fetchSiteMeta } from "@/lib/preview";

export const dynamic = "force-dynamic";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/**
 * One field is enough: a product URL or an @handle. Brand name, tagline and
 * logo are unfurled from the page unless the sponsor overrides them. Email is
 * collected by the payment provider, not here.
 */
const bodySchema = z.object({
  slotId: z.string().min(1),
  target: z.string().trim().min(1).max(300),
  amountCents: z.number().int().positive().max(100_000_000),
  brandName: optionalText(40),
  tagline: optionalText(60),
  logoUrl: optionalText(500),
  agreed: z.literal(true),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const def = SLOT_BY_ID[data.slotId];
  if (!def) return NextResponse.json({ error: "Unknown slot" }, { status: 404 });

  const meta = await fetchSiteMeta(data.target);
  if (!meta) return NextResponse.json({ error: "That doesn't look like a URL or @handle" }, { status: 400 });

  const brandName = (data.brandName || meta.title || meta.target.name).slice(0, 40);
  const tagline = (data.tagline || meta.description || "").slice(0, 60) || null;
  const logoUrl = data.logoUrl || meta.image || meta.target.logoUrl || null;

  const bidId = `bid_${nanoid(14)}`;
  const result = await createPendingBid(
    {
      slotId: def.id,
      brandName,
      url: meta.target.url,
      tagline,
      logoUrl,
      email: "",
      amountCents: data.amountCents,
    },
    bidId,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error, minBidCents: result.minBidCents }, { status: 409 });
  }

  if (!isDodoConfigured()) {
    const base = process.env.NODE_ENV === "production" ? siteUrl() : new URL(req.url).origin;
    return NextResponse.json({ bidId, checkoutUrl: `${base}/api/dev/complete?bid=${encodeURIComponent(bidId)}`, devMode: true });
  }

  try {
    const { sessionId, url } = await createDodoCheckout({
      bidId,
      slotId: def.id,
      slotLabel: def.label,
      amountCents: data.amountCents,
      brandName,
    });
    await attachCheckoutSession(bidId, sessionId);
    return NextResponse.json({ bidId, checkoutUrl: url, devMode: false });
  } catch (err) {
    await markBidFailed(bidId);
    console.error("[checkout] Dodo error", err);
    return NextResponse.json({ error: "Payment provider error" }, { status: 502 });
  }
}
