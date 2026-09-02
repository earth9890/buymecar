import { NextResponse } from "next/server";
import { isDodoConfigured, siteUrl } from "@/lib/dodo";
import { markBidPaid } from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * DEV-ONLY fake payment completion. Only reachable when Dodo is NOT configured,
 * so it can never be used to grab a slot for free in production.
 */
export async function GET(req: Request) {
  if (isDodoConfigured()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const bidId = new URL(req.url).searchParams.get("bid");
  if (!bidId) return NextResponse.json({ error: "Missing bid" }, { status: 400 });
  const bid = await markBidPaid(bidId, `dev_${Date.now()}`);
  if (!bid) return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  const base = process.env.NODE_ENV === "production" ? siteUrl() : new URL(req.url).origin;
  return NextResponse.redirect(`${base}/success?bid=${encodeURIComponent(bidId)}&dev=1`, 303);
}
