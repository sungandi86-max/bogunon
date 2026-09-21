import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseClient, getSupabaseConfig, getUser } = vi.hoisted(() => ({
  createSupabaseClient: vi.fn(),
  getSupabaseConfig: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: createSupabaseClient }));
vi.mock("@/lib/supabase/config", () => ({ getSupabaseConfig }));

import {
  createDesktopBearerContext,
  DesktopBearerUnauthorizedError,
} from "@/lib/supabase/bearer-server";

describe("desktop bearer server client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSupabaseConfig.mockReturnValue({
      publishableKey: "publishable-test-key",
      url: "https://example.supabase.co",
    });
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    createSupabaseClient
      .mockReturnValueOnce({ auth: { getUser } })
      .mockReturnValueOnce({ from: vi.fn() });
  });

  it.each([
    null,
    "",
    "Basic abc",
    "Bearer",
    "Bearer ",
    "Bearer one two",
    "Bearer one,Bearer two",
  ])("rejects a missing or malformed Authorization header", async (header) => {
    await expect(createDesktopBearerContext(header)).rejects.toBeInstanceOf(
      DesktopBearerUnauthorizedError,
    );
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it("verifies the access token and applies the same token to the RLS client", async () => {
    const context = await createDesktopBearerContext("Bearer access-token");

    expect(getUser).toHaveBeenCalledWith("access-token");
    expect(context.userId).toBe("user-1");
    expect(createSupabaseClient).toHaveBeenNthCalledWith(
      1,
      "https://example.supabase.co",
      "publishable-test-key",
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
    expect(createSupabaseClient).toHaveBeenNthCalledWith(
      2,
      "https://example.supabase.co",
      "publishable-test-key",
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
        global: { headers: { Authorization: "Bearer access-token" } },
      },
    );
  });

  it("rejects a token that Supabase Auth cannot verify", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });

    await expect(createDesktopBearerContext("Bearer expired-token")).rejects.toBeInstanceOf(
      DesktopBearerUnauthorizedError,
    );
  });

  it("creates isolated clients for concurrent caller tokens", async () => {
    createSupabaseClient.mockReset();
    createSupabaseClient.mockImplementation((...args: readonly unknown[]) => {
      if (JSON.stringify(args[2]).includes("Authorization")) return { from: vi.fn() };
      return {
        auth: {
          getUser: vi.fn(async (token: string) => ({
            data: { user: { id: token === "token-a" ? "user-a" : "user-b" } },
            error: null,
          })),
        },
      };
    });

    const [first, second] = await Promise.all([
      createDesktopBearerContext("Bearer token-a"),
      createDesktopBearerContext("Bearer token-b"),
    ]);

    expect([first.userId, second.userId]).toEqual(["user-a", "user-b"]);
    const bearerClientOptions = createSupabaseClient.mock.calls
      .map((call) => call[2])
      .filter((options) => JSON.stringify(options).includes("Authorization"));
    expect(bearerClientOptions).toEqual([
      expect.objectContaining({ global: { headers: { Authorization: "Bearer token-a" } } }),
      expect.objectContaining({ global: { headers: { Authorization: "Bearer token-b" } } }),
    ]);
  });
});
