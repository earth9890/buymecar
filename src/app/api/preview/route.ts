import { NextResponse } from "next/server";
import { fetchSiteMeta } from "@/lib/preview";

export const dynamic = "force-dynamic";

/** Link unfurl for the claim form: title, description, image for a URL or @handle. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const meta = await fetchSiteMeta(q);
  if (!meta) return NextResponse.json({ error: "Enter a URL or @handle" }, { status: 400 });
  return NextResponse.json(meta, { headers: { "Cache-Control": "public, max-age=300" } });
}
