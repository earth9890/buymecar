import { NextResponse } from "next/server";
import { recordClick } from "@/lib/repo";

export const dynamic = "force-dynamic";

/** Click-through for a sponsored panel: counts it, then sends the visitor on. */
export async function GET(req: Request, ctx: { params: Promise<{ slotId: string }> }) {
  const { slotId } = await ctx.params;
  const url = await recordClick(slotId);
  if (!url) return NextResponse.redirect(new URL("/", req.url), 302);
  return NextResponse.redirect(url, 302);
}
