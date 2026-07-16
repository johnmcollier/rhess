import type { FastifyRequest } from "fastify";

/**
 * Host header values safe to embed in public URLs / install commands.
 * Parses the value as an HTTP authority (via WHATWG URL) so hostname/IPv4/
 * bracketed IPv6 (+ optional port) are accepted, while credentials, paths,
 * queries, fragments, and other spoof markers are rejected.
 */
export function isSafeHostHeader(host: string | undefined): boolean {
  if (!host) return false;
  if (host.length > 253) return false;
  // Reject obvious spoof / multi-value markers before URL parsing.
  if (/[\s@\\/,]/.test(host)) return false;

  try {
    const parsed = new URL(`http://${host}`);
    // Authority-only: no userinfo, path (beyond "/"), query, or fragment.
    if (parsed.username || parsed.password) return false;
    if (parsed.pathname !== "/") return false;
    if (parsed.search || parsed.hash) return false;
    if (!parsed.hostname) return false;

    // Port must be empty or an integer in 1–65535 (URL parser already validates syntax).
    if (parsed.port) {
      const port = Number(parsed.port);
      if (!Number.isInteger(port) || port < 1 || port > 65535) return false;
    }

    // URL parsing lowercases DNS/IPv6; compare case-insensitively so valid Host
    // values are not rejected solely due to canonicalization.
    return parsed.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Return a canonical host authority for embedding in public URLs, or null if unsafe.
 * Uses the URL parser's normalized form (lowercase DNS/IPv6, bracketed IPv6).
 */
export function canonicalizeHostHeader(host: string | undefined): string | null {
  if (!isSafeHostHeader(host)) return null;
  try {
    return new URL(`http://${host}`).host;
  } catch {
    return null;
  }
}

/**
 * Derive the server's public base URL.
 *
 * Priority:
 *   1. PUBLIC_BASE_URL env var — the only trusted source for proxy deployments.
 *   2. req.protocol + validated Host header — for direct (non-proxied) access.
 *      Invalid/spoofed Host values fall back to `localhost` (no port) rather than
 *      reflecting attacker-controlled origins into install commands / discovery URLs.
 */
export function resolveBaseUrl(req: FastifyRequest): string {
  const configured = process.env["PUBLIC_BASE_URL"];
  if (configured) return configured.replace(/\/+$/, "");

  const raw = req.headers.host;
  const candidate = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  const host = canonicalizeHostHeader(candidate) ?? "localhost";
  const protocol = req.protocol === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}
