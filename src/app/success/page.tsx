import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBid } from "@/lib/repo";
import { SLOT_BY_ID } from "@/lib/slots-config";
import { formatUsd } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: PageProps<"/success">) {
  const { bid: bidId } = await searchParams;
  const bid = typeof bidId === "string" ? await getBid(bidId) : null;
  const slot = bid ? SLOT_BY_ID[bid.slotId] : null;

  const state = !bid ? "missing" : bid.status === "paid" ? "paid" : bid.status === "pending" ? "pending" : bid.status === "outbid" ? "outbid" : "failed";

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      {state === "pending" && <meta httpEquiv="refresh" content="4" />}
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2">
            {state === "paid" && <CheckCircle2 className="size-10 text-emerald-400" />}
            {state === "pending" && <Clock className="size-10 animate-pulse text-amber-400" />}
            {(state === "failed" || state === "missing") && <XCircle className="size-10 text-destructive" />}
            {state === "outbid" && <CheckCircle2 className="size-10 text-muted-foreground" />}
          </div>
          <CardTitle className="font-heading text-2xl">
            {state === "paid" && "You're on the car."}
            {state === "pending" && "Confirming your payment…"}
            {state === "outbid" && "You were on the car. Someone paid more."}
            {state === "failed" && "Payment didn't go through."}
            {state === "missing" && "We couldn't find that purchase."}
          </CardTitle>
          <CardDescription>
            {bid && slot && (
              <>
                <span className="font-medium text-foreground">{bid.brandName}</span> on the{" "}
                <span className="font-medium text-foreground">{slot.label}</span> for {formatUsd(bid.amountCents)}.
              </>
            )}
            {state === "pending" && " This page refreshes itself once Dodo confirms."}
            {state === "paid" && " Every click on that panel now goes to your link. Hold it by staying the highest payer."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button render={<Link href="/" />}>Back to the car</Button>
          {bid && (
            <Button variant="secondary" render={<a href={bid.url} target="_blank" rel="noopener noreferrer nofollow" />}>
              Open your link
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
