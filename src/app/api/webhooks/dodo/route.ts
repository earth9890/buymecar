import { NextResponse } from "next/server";
import { getDodo, isDodoConfigured } from "@/lib/dodo";
import { getBidBySession, markBidFailed, markBidPaid } from "@/lib/repo";

export const dynamic = "force-dynamic";

/**
 * Dodo Payments webhook. Signature is verified with DODO_PAYMENTS_WEBHOOK_KEY
 * (Standard Webhooks). On `payment.succeeded` the bid becomes the slot owner.
 */
export async function POST(req: Request) {
  if (!isDodoConfigured() || !process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const raw = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));

  let event;
  try {
    event = getDodo().webhooks.unwrap(raw, { headers });
  } catch (err) {
    console.error("[dodo webhook] signature failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment.succeeded" || event.type === "payment.failed") {
    const payment = event.data;
    const meta = (payment.metadata ?? {}) as Record<string, string>;
    let bidId: string | undefined = meta.bid_id;
    if (!bidId && payment.checkout_session_id) {
      bidId = (await getBidBySession(payment.checkout_session_id))?.id;
    }
    if (!bidId) {
      console.warn("[dodo webhook] no bid_id on payment", payment.payment_id);
      return NextResponse.json({ received: true, ignored: true });
    }
    if (event.type === "payment.succeeded") await markBidPaid(bidId, payment.payment_id);
    else await markBidFailed(bidId);
  }

  return NextResponse.json({ received: true });
}
