import DodoPayments from "dodopayments";

/** True when a real Dodo Payments key is present; otherwise the app runs in dev mode. */
export function isDodoConfigured(): boolean {
  return Boolean(process.env.DODO_PAYMENTS_API_KEY && process.env.DODO_PRODUCT_ID);
}

let client: DodoPayments | null = null;

export function getDodo(): DodoPayments {
  if (!client) {
    const env = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
    client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
      environment: env,
    });
  }
  return client;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export interface CheckoutArgs {
  bidId: string;
  slotId: string;
  slotLabel: string;
  amountCents: number;
  email?: string;
  brandName: string;
}

/**
 * Creates a Dodo checkout session for a fixed amount against the configured
 * "pay what you want" product. Returns the hosted checkout URL.
 */
export async function createDodoCheckout(args: CheckoutArgs): Promise<{ sessionId: string; url: string }> {
  const dodo = getDodo();
  const session = await dodo.checkoutSessions.create({
    product_cart: [
      { product_id: process.env.DODO_PRODUCT_ID!, quantity: 1, amount: args.amountCents },
    ],
    ...(args.email ? { customer: { email: args.email, name: args.brandName } } : {}),
    return_url: `${siteUrl()}/success?bid=${encodeURIComponent(args.bidId)}`,
    metadata: {
      bid_id: args.bidId,
      slot_id: args.slotId,
      slot_label: args.slotLabel,
      brand: args.brandName,
    },
  });
  if (!session.checkout_url) throw new Error("Dodo did not return a checkout_url");
  return { sessionId: session.session_id, url: session.checkout_url };
}
