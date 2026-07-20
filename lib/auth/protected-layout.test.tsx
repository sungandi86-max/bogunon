import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedLayout from "@/app/(app)/layout";

const { getUser, redirect } = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { readonly children: React.ReactNode }) => children,
}));

describe("protected app layout", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    getUser.mockReset();
    redirect.mockClear();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("redirects an expired server session to the Korean login state", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });

    await expect(ProtectedLayout({ children: <div /> })).rejects.toThrow(
      "redirect:/login?error=session_expired",
    );
    expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
  });

  it("rejects protected rendering when public authentication settings are absent", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    await expect(ProtectedLayout({ children: <div /> })).rejects.toThrow(
      "redirect:/login?error=configuration",
    );
    expect(getUser).not.toHaveBeenCalled();
  });
});
