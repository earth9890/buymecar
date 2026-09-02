import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * "N watching" counter. Anonymous ids heartbeat every ~25s; anyone silent for
 * 70s drops out. In-memory, so it is per server instance, which is fine for
 * a single-region deploy and never worth a database.
 */
const globalPresence = globalThis as unknown as { __presence?: Map<string, number> };
const seen = globalPresence.__presence ?? (globalPresence.__presence = new Map());

export async function POST(req: Request) {
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  const now = Date.now();
  if (typeof id === "string" && id.length <= 64) seen.set(id, now);
  for (const [k, t] of seen) if (now - t > 70_000) seen.delete(k);
  return NextResponse.json({ watching: Math.max(1, seen.size) });
}
