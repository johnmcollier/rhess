import type { FastifyRequest } from "fastify";

/**
 * Host header values safe to embed in public URLs / install commands.
 * Rejects credentials, paths, spaces, commas (multi-value), and other spoof markers.
 * Allows hostname, hostname:port, IPv4, and IPv4:port.
 */
const SAFE_HOST_RE =
  /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?:\.(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?))*|localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d{1,5})?$/;

export function isSafeHostHeader(host: string | undefined): boolean {
  if (!host) return false;
  if (host.length > 253) return false;
  if (/[\s@\\/,]/.test(host)) return false;
  return SAFE_HOST_RE.test(host);
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
  const host = isSafeHostHeader(candidate) ? candidate! : "localhost";
  const protocol = req.protocol === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}
