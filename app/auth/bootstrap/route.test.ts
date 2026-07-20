import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/auth/bootstrap/route";

const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

describe("post-login user settings bootstrap entry point", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: "user-id" } }, error: null });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("verifies the established session before continuing to briefing", async () => {
    const response = await GET(
      new Request("https://bogunon.example/auth/bootstrap?next=%2Fbriefing"),
    );

    expect(getUser).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe("https://bogunon.example/briefing");
    expect(response.headers.get("set-cookie")).toContain(
      "bogunon-user-settings-bootstrap=required",
    );
  });

  it("rejects an external destination after the session check", async () => {
    const response = await GET(
      new Request("https://bogunon.example/auth/bootstrap?next=https://attacker.example"),
    );

    expect(response.headers.get("location")).toBe("https://bogunon.example/briefing");
  });

  it("returns an expired-session state when the exchanged session is unavailable", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });

    const response = await GET(new Request("https://bogunon.example/auth/bootstrap"));

    expect(response.headers.get("location")).toBe(
      "https://bogunon.example/login?error=session_expired",
    );
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("does not queue settings initialization without public authentication settings", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const response = await GET(new Request("https://bogunon.example/auth/bootstrap"));

    expect(getUser).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("location")).toBe(
      "https://bogunon.example/login?error=configuration",
    );
  });
});
