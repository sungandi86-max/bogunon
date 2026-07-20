import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { updateSession } from "@/lib/supabase/proxy";
import { proxy as appProxy } from "@/proxy";

type ProxyCookieAdapter = {
  readonly setAll: (
    cookies: Array<{
      readonly name: string;
      readonly options: { readonly httpOnly?: boolean; readonly path?: string };
      readonly value: string;
    }>,
    headers: Record<string, string>,
  ) => void;
};

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
let cookieAdapter: ProxyCookieAdapter | undefined;

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { readonly cookies: ProxyCookieAdapter },
  ) => {
    cookieAdapter = options.cookies;
    return { auth: { getUser } };
  },
}));

describe("Supabase session proxy", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("sends an unauthenticated protected request to login", async () => {
    const response = await updateSession(new NextRequest("https://bogunon.example/briefing"));

    expect(response.headers.get("location")).toBe("https://bogunon.example/login");
  });

  it.each([
    "/manifest.webmanifest",
    "/icon.png",
    "/apple-icon.png",
    "/favicon.ico",
    "/icon-192.png",
    "/icon-512.png",
    "/icon-maskable-192.png",
    "/icon-maskable-512.png",
    "/sw.js",
    "/offline",
    "/offline.html",
    "/_next/static/chunks/app.js",
    "/_next/image/image.webp",
    "/images/brand.png",
    "/public/asset.txt",
  ])("keeps the public PWA path %s outside authentication", async (pathname) => {
    const response = await updateSession(new NextRequest(`https://bogunon.example${pathname}`));

    expect(response.headers.get("location")).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it.each(["/privacy", "/terms"])(
    "keeps the public legal path %s outside authentication",
    async (pathname) => {
      const response = await updateSession(new NextRequest(`https://bogunon.example${pathname}`));

      expect(response.headers.get("location")).toBeNull();
      expect(getUser).not.toHaveBeenCalled();
    },
  );

  it("adds strict browser security headers to application responses", async () => {
    const response = await appProxy(new NextRequest("https://bogunon.example/privacy"));

    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(response.headers.get("content-security-policy")).toMatch(/script-src 'self' 'nonce-[^']+'/);
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("permissions-policy")).toBe(
      "camera=(), geolocation=(), microphone=()",
    );
  });

  it("preserves the destination when an existing session has expired", async () => {
    const request = new NextRequest("https://bogunon.example/tasks?filter=today", {
      headers: { cookie: "sb-example-auth-token=expired" },
    });
    const response = await updateSession(request);

    expect(response.headers.get("location")).toBe(
      "https://bogunon.example/login?error=session_expired&next=%2Ftasks%3Ffilter%3Dtoday",
    );
  });

  it("returns an authenticated login request to a safe protected destination", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-id" } }, error: null });
    const response = await updateSession(
      new NextRequest("https://bogunon.example/login?next=%2Fcalendar"),
    );

    expect(response.headers.get("location")).toBe("https://bogunon.example/calendar");
  });

  it("does not treat a similar auth prefix as a public route", async () => {
    const response = await updateSession(new NextRequest("https://bogunon.example/authentication"));

    expect(response.headers.get("location")).toBe("https://bogunon.example/login");
  });

  it("copies refreshed session cookies and cache headers to the response", async () => {
    getUser.mockImplementation(async () => {
      cookieAdapter?.setAll(
        [{
          name: "sb-example-auth-token",
          options: { httpOnly: true, path: "/" },
          value: "refreshed-token",
        }],
        { "cache-control": "private, no-store" },
      );
      return { data: { user: { id: "user-id" } }, error: null };
    });

    const response = await updateSession(new NextRequest("https://bogunon.example/briefing"));

    expect(response.headers.get("set-cookie")).toContain(
      "sb-example-auth-token=refreshed-token",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("redirects protected routes to a configuration error without public settings", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const response = await updateSession(new NextRequest("https://bogunon.example/briefing"));

    expect(getUser).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://bogunon.example/login?error=configuration",
    );
  });
});
