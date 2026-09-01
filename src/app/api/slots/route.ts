import { NextResponse } from "next/server";
import { getSlotsPayload } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getSlotsPayload();
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
