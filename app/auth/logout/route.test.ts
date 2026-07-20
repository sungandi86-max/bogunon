import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/auth/logout/route";

const signOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signOut } }),
}));

describe("logout route", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    signOut.mockReset();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("ends the session and returns to login", async () => {
    signOut.mockResolvedValue({ error: null });

    const response = await POST(new Request("https://bogunon.example/auth/logout", { method: "POST" }));

    expect(signOut).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://bogunon.example/login");
  });

  it("returns a Korean-facing error code when logout fails", async () => {
    signOut.mockResolvedValue({ error: new Error("network") });

    const response = await POST(new Request("https://bogunon.example/auth/logout", { method: "POST" }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://bogunon.example/login?error=logout");
  });

  it("returns a configuration error without creating a client when public settings are absent", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const response = await POST(
      new Request("https://bogunon.example/auth/logout", { method: "POST" }),
    );

    expect(signOut).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://bogunon.example/login?error=configuration",
    );
  });
});
