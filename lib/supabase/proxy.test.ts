import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { updateSession } from "@/lib/supabase/proxy";

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

const { getClaims } = vi.hoisted(() => ({ getClaims: vi.fn() }));
let cookieAdapter: ProxyCookieAdapter | undefined;

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { readonly cookies: ProxyCookieAdapter },
  ) => {
    cookieAdapter = options.cookies;
    return { auth: { getClaims } };
  },
}));

describe("Supabase session proxy", () => {
  beforeEach(() => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://example.supabase.co";
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] = "test-publishable-key";
    getClaims.mockReset();
    getClaims.mockResolvedValue({ data: { claims: null }, error: null });
  });

  afterEach(() => {
    delete process.env["NEXT_PUBLIC_SUPABASE_URL"];
    delete process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  });

  it("sends an unauthenticated protected request to login", async () => {
    const response = await updateSession(new NextRequest("https://bogunon.example/briefing"));

    expect(response.headers.get("location")).toBe("https://bogunon.example/login");
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
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-id" } }, error: null });
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
    getClaims.mockImplementation(async () => {
      cookieAdapter?.setAll(
        [{
          name: "sb-example-auth-token",
          options: { httpOnly: true, path: "/" },
          value: "refreshed-token",
        }],
        { "cache-control": "private, no-store" },
      );
      return { data: { claims: { sub: "user-id" } }, error: null };
    });

    const response = await updateSession(new NextRequest("https://bogunon.example/briefing"));

    expect(response.headers.get("set-cookie")).toContain(
      "sb-example-auth-token=refreshed-token",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("redirects protected routes to a configuration error without public settings", async () => {
    delete process.env["NEXT_PUBLIC_SUPABASE_URL"];
    delete process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

    const response = await updateSession(new NextRequest("https://bogunon.example/briefing"));

    expect(getClaims).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://bogunon.example/login?error=configuration",
    );
  });
});
