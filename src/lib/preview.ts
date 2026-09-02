import { parseTarget, type Target } from "./target";

export interface SiteMeta {
  title: string;
  description: string | null;
  image: string | null;
  target: Target;
}

const cache = new Map<string, { at: number; meta: SiteMeta }>();
const TTL = 10 * 60 * 1000;

function pick(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1] ? decode(m[1].trim()) : null;
}
function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");
}
function meta(html: string, prop: string): string | null {
  return (
    pick(html, new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i")) ??
    pick(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"))
  );
}

/**
 * Best-effort page metadata for a sponsor URL, like a link unfurl. Never
 * throws: on any failure it falls back to what the URL alone tells us.
 */
export async function fetchSiteMeta(input: string): Promise<SiteMeta | null> {
  const target = parseTarget(input);
  if (!target) return null;
  const fallback: SiteMeta = { title: target.name, description: null, image: target.logoUrl, target };
  if (target.kind === "handle") return fallback;

  const hit = cache.get(target.url);
  if (hit && Date.now() - hit.at < TTL) return hit.meta;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(target.url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; buymecar-preview/1.0)", accept: "text/html" },
    });
    clearTimeout(t);
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return fallback;
    const html = (await res.text()).slice(0, 250_000);
    const title = meta(html, "og:title") ?? meta(html, "twitter:title") ?? pick(html, /<title[^>]*>([^<]+)<\/title>/i);
    const description = meta(html, "og:description") ?? meta(html, "description") ?? meta(html, "twitter:description");
    let image = meta(html, "og:image") ?? meta(html, "twitter:image");
    if (!image) {
      const icon = pick(html, /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
      if (icon) image = icon;
    }
    if (image) {
      try {
        image = new URL(image, target.url).toString();
      } catch {
        image = null;
      }
    }
    const out: SiteMeta = {
      title: (title ?? target.name).slice(0, 80),
      description: description ? description.slice(0, 160) : null,
      image: image ?? target.logoUrl,
      target,
    };
    cache.set(target.url, { at: Date.now(), meta: out });
    return out;
  } catch {
    return fallback;
  }
}
