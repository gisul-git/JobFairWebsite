/**
 * Public site origin for links and Open Graph (use env, then reverse-proxy headers).
 */
export function publicSiteOriginFromRequest(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const proto = (req.headers.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .split(",")[0]
    .trim();
  if (host) return `${proto}://${host}`;

  try {
    return new URL(req.url).origin;
  } catch {
    return "";
  }
}

/** Same logic for App Router `headers()` (no Request object in generateMetadata). */
export function publicSiteOriginFromHeaders(h: { get(name: string): string | null }): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const proto = (h.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  if (host) return `${proto}://${host}`;

  return "";
}

/** When API built a URL with wrong host, align to the tab the user is actually on. */
export function normalizeShareUrlToCurrentOrigin(shareUrl: string): string {
  if (typeof window === "undefined") return shareUrl;
  try {
    const u = new URL(shareUrl);
    return `${window.location.origin}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return shareUrl;
  }
}
