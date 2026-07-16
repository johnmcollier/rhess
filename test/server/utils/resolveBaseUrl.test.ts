import { describe, it, expect, afterEach } from "vitest";
import type { FastifyRequest } from "fastify";
import { isSafeHostHeader, resolveBaseUrl } from "../../../src/server/utils/resolveBaseUrl.js";

describe("isSafeHostHeader", () => {
  it("accepts DNS hostnames with optional port", () => {
    expect(isSafeHostHeader("localhost")).toBe(true);
    expect(isSafeHostHeader("localhost:3000")).toBe(true);
    expect(isSafeHostHeader("rhess.example.com")).toBe(true);
    expect(isSafeHostHeader("rhess.example.com:8443")).toBe(true);
  });

  it("accepts mixed-case DNS hosts that URL parsing lowercases", () => {
    expect(isSafeHostHeader("EXAMPLE.COM")).toBe(true);
    expect(isSafeHostHeader("Example.COM:3000")).toBe(true);
    expect(isSafeHostHeader("[2001:DB8::1]:8080")).toBe(true);
  });

  it("accepts IPv4 with optional port", () => {
    expect(isSafeHostHeader("127.0.0.1")).toBe(true);
    expect(isSafeHostHeader("127.0.0.1:3000")).toBe(true);
  });

  it("accepts bracketed IPv6 with optional port", () => {
    expect(isSafeHostHeader("[::1]")).toBe(true);
    expect(isSafeHostHeader("[::1]:3000")).toBe(true);
    expect(isSafeHostHeader("[2001:db8::1]")).toBe(true);
    expect(isSafeHostHeader("[2001:db8::1]:8080")).toBe(true);
  });

  it("rejects spoofed or malformed hosts", () => {
    expect(isSafeHostHeader(undefined)).toBe(false);
    expect(isSafeHostHeader("")).toBe(false);
    expect(isSafeHostHeader("evil.example.com@attacker.test")).toBe(false);
    expect(isSafeHostHeader("host with spaces")).toBe(false);
    expect(isSafeHostHeader("a,b")).toBe(false);
    expect(isSafeHostHeader("example.com/path")).toBe(false);
    expect(isSafeHostHeader("::1")).toBe(false); // must be bracketed in Host
    expect(isSafeHostHeader("[::1]:99999")).toBe(false);
    expect(isSafeHostHeader("user:pass@example.com")).toBe(false);
  });
});

describe("resolveBaseUrl", () => {
  const original = process.env["PUBLIC_BASE_URL"];

  afterEach(() => {
    if (original === undefined) delete process.env["PUBLIC_BASE_URL"];
    else process.env["PUBLIC_BASE_URL"] = original;
  });

  function fakeReq(host: string, protocol: "http" | "https" = "http"): FastifyRequest {
    return {
      protocol,
      headers: { host },
      hostname: "ignored",
    } as unknown as FastifyRequest;
  }

  it("prefers PUBLIC_BASE_URL", () => {
    process.env["PUBLIC_BASE_URL"] = "https://rhess.example.com/";
    expect(resolveBaseUrl(fakeReq("localhost:3000"))).toBe("https://rhess.example.com");
  });

  it("preserves IPv6 Host literals", () => {
    delete process.env["PUBLIC_BASE_URL"];
    expect(resolveBaseUrl(fakeReq("[::1]:3000"))).toBe("http://[::1]:3000");
  });

  it("emits canonical lowercase DNS hosts", () => {
    delete process.env["PUBLIC_BASE_URL"];
    expect(resolveBaseUrl(fakeReq("Example.COM:3000"))).toBe("http://example.com:3000");
  });

  it("falls back to localhost for spoofed Host", () => {
    delete process.env["PUBLIC_BASE_URL"];
    expect(resolveBaseUrl(fakeReq("evil@attacker.test"))).toBe("http://localhost");
  });
});
