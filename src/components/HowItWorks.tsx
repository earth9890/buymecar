"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function HowItWorks() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <CircleHelp className="size-4" /> How it works
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Buy me a car. Get a billboard.</DialogTitle>
          <DialogDescription>Internet-funded G-Wagon, one panel at a time.</DialogDescription>
        </DialogHeader>
        <ol className="grid gap-3 text-sm">
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            <span>Spin the car. Every glowing rectangle is a sponsor spot. Click one.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            <span>Enter your brand, a link and a price. Pay. Your name goes on the car and every click on that panel goes to your link.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
            <span>Anyone can take your spot by paying at least 20% more. You can take it back the same way. The car remembers everyone who paid.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
            <span>When the bar fills, I buy the actual Mercedes-AMG G63 and wrap it with every sponsor exactly like this page. Receipts and photos posted here.</span>
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Payments handled by Dodo Payments. Being outbid does not refund you; it&apos;s a bidding war, not a store.
          Inspired by outbid.lol.
        </p>
      </DialogContent>
    </Dialog>
  );
}
