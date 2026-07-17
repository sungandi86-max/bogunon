import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/auth/callback/route";

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession } }),
}));

describe("OAuth callback", () => {
  beforeEach(() => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://example.supabase.co";
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] = "test-publishable-key";
    exchangeCodeForSession.mockReset();
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });
  });

  afterEach(() => {
    delete process.env["NEXT_PUBLIC_SUPABASE_URL"];
    delete process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  });

  it("exchanges the authorization code and redirects to the protected destination", async () => {
    const response = await GET(
      new Request("https://bogunon.example/auth/callback?code=oauth-code&next=%2Fcalendar"),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(response.headers.get("location")).toBe(
      "https://bogunon.example/auth/bootstrap?next=%2Fcalendar",
    );
  });

  it("rejects an external post-login redirect", async () => {
    const response = await GET(
      new Request("https://bogunon.example/auth/callback?code=oauth-code&next=https://attacker.example"),
    );

    expect(response.headers.get("location")).toBe(
      "https://bogunon.example/auth/bootstrap?next=%2Fbriefing",
    );
  });

  it("returns to login with a public error when the callback has no code", async () => {
    const response = await GET(new Request("https://bogunon.example/auth/callback?error=access_denied"));

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://bogunon.example/login?error=oauth");
  });

  it("returns a configuration error without creating a client when public settings are absent", async () => {
    delete process.env["NEXT_PUBLIC_SUPABASE_URL"];
    delete process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

    const response = await GET(
      new Request("https://bogunon.example/auth/callback?code=oauth-code"),
    );

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://bogunon.example/login?error=configuration",
    );
  });
});
