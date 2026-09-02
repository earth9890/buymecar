/**
 * What a sponsor types: a product URL or an @handle. Both normalise to a link,
 * a display name and a logo guess. Works on the client and the server.
 */
export interface Target {
  kind: "url" | "handle";
  url: string;
  host: string;
  /** Best-effort display name before we have fetched the page. */
  name: string;
  /** Best-effort logo before we have fetched the page. */
  logoUrl: string;
}

const HANDLE = /^@?([A-Za-z0-9_]{1,15})$/;

export function parseTarget(input: string): Target | null {
  const raw = input.trim();
  if (!raw) return null;
  const h = raw.match(HANDLE);
  if (h && (raw.startsWith("@") || !raw.includes("."))) {
    const handle = h[1];
    return {
      kind: "handle",
      url: `https://x.com/${handle}`,
      host: "x.com",
      name: `@${handle}`,
      logoUrl: `https://unavatar.io/x/${handle}`,
    };
  }
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return null;
  const host = u.hostname.replace(/^www\./, "");
  return {
    kind: "url",
    url: u.toString(),
    host,
    name: nameFromHost(host),
    logoUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
  };
}

export function nameFromHost(host: string): string {
  const label = host.split(".")[0] ?? host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}
