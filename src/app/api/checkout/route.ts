import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { attachCheckoutSession, createPendingBid, markBidFailed } from "@/lib/repo";
import { createDodoCheckout, isDodoConfigured, siteUrl } from "@/lib/dodo";
import { SLOT_BY_ID } from "@/lib/slots-config";

export const dynamic = "force-dynamic";

const httpUrl = z
  .string()
  .trim()
  .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
  .pipe(z.url({ protocol: /^https?$/ }));

const bodySchema = z.object({
  slotId: z.string().min(1),
  brandName: z.string().trim().min(1).max(40),
  url: httpUrl,
  tagline: z.string().trim().max(60).optional().or(z.literal("")),
  logoUrl: httpUrl.optional().or(z.literal("")),
  email: z.email(),
  amountCents: z.number().int().positive().max(100_000_000),
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

  const bidId = `bid_${nanoid(14)}`;
  const result = await createPendingBid(
    {
      slotId: def.id,
      brandName: data.brandName,
      url: data.url,
      tagline: data.tagline || null,
      logoUrl: data.logoUrl || null,
      email: data.email,
      amountCents: data.amountCents,
    },
    bidId,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, minBidCents: result.minBidCents },
      { status: 409 },
    );
  }

  // DEV MODE: no Dodo credentials. Simulate a hosted checkout that instantly succeeds.
  if (!isDodoConfigured()) {
    const url = `${siteUrl()}/api/dev/complete?bid=${encodeURIComponent(bidId)}`;
    return NextResponse.json({ bidId, checkoutUrl: url, devMode: true });
  }

  try {
    const { sessionId, url } = await createDodoCheckout({
      bidId,
      slotId: def.id,
      slotLabel: def.label,
      amountCents: data.amountCents,
      email: data.email,
      brandName: data.brandName,
    });
    await attachCheckoutSession(bidId, sessionId);
    return NextResponse.json({ bidId, checkoutUrl: url, devMode: false });
  } catch (err) {
    await markBidFailed(bidId);
    console.error("[checkout] Dodo error", err);
    return NextResponse.json({ error: "Payment provider error" }, { status: 502 });
  }
}
