"use client";

import { ExternalLink, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUsd } from "@/lib/pricing";
import type { SlotView } from "@/lib/types";
import { brandColor, hostOf } from "@/components/car/materials";

interface Props {
  slots: SlotView[];
  onPick: (id: string) => void;
}

export function Leaderboard({ slots, onPick }: Props) {
  const owned = slots.filter((s) => s.owner).sort((a, b) => b.owner!.amountCents - a.owner!.amountCents);
  const open = slots.filter((s) => !s.owner).sort((a, b) => b.minBidCents - a.minBidCents);

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="secondary" size="sm" />}>
        <Trophy className="size-4" /> Sponsors
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">Who&apos;s on the car</SheetTitle>
          <SheetDescription>
            {owned.length} of {slots.length} spots taken. Any spot can be taken over by paying 20% more.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {owned.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Spot</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owned.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => onPick(s.id)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: brandColor(s.owner!.brandName) }} />
                        <a
                          href={s.owner!.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-medium hover:underline"
                        >
                          {s.owner!.brandName} <ExternalLink className="size-3 opacity-60" />
                        </a>
                      </div>
                      <div className="text-xs text-muted-foreground">{hostOf(s.owner!.url)}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.label}</TableCell>
                    <TableCell className="text-right font-mono">{formatUsd(s.owner!.amountCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">Still open</div>
          <Table>
            <TableBody>
              {open.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => onPick(s.id)}>
                  <TableCell>{s.label}</TableCell>
                  <TableCell className="text-right font-mono">{formatUsd(s.minBidCents)}</TableCell>
                </TableRow>
              ))}
              {open.length === 0 && (
                <TableRow>
                  <TableCell className="text-center text-muted-foreground">Sold out. Outbid someone.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
