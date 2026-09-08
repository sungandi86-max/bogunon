import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

type SupabaseClientAuthOptions = {
  readonly autoRefreshToken: boolean;
  readonly detectSessionInUrl: boolean;
  readonly persistSession: boolean;
};

type SupabaseClientOptions = {
  readonly auth: SupabaseClientAuthOptions;
};

type CreatedClient = {
  readonly kind: "created-supabase-admin-client";
};

type RecordedCreateClientCall = {
  readonly key: string;
  readonly options: SupabaseClientOptions;
  readonly url: string;
};

const createdClient: CreatedClient = { kind: "created-supabase-admin-client" };
const createClientCalls = vi.hoisted((): RecordedCreateClientCall[] => []);

vi.mock("server-only", () => ({}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, key: string, options: SupabaseClientOptions): CreatedClient => {
    createClientCalls.push({ key, options, url });
    return createdClient;
  },
}));

describe("Supabase admin client", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    createClientCalls.length = 0;
  });

  it("creates a server-only secret-key client with auth session state disabled", async () => {
    // Given: backend-only Supabase admin configuration is present.
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_unit_test_key");

    const { createAdminClient } = await import("@/lib/supabase/admin");

    // When: the admin client is created.
    const client = createAdminClient();

    // Then: only the secret backend credentials are passed to supabase-js.
    expect(client).toBe(createdClient);
    expect(createClientCalls).toStrictEqual([
      {
        key: "sb_secret_unit_test_key",
        options: {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
        },
        url: "https://example.supabase.co",
      },
    ]);
  });

  it("throws a typed missing-url failure before creating a client", async () => {
    // Given: the secret exists but the backend URL is absent.
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_unit_test_key");

    const { createAdminClient, SupabaseAdminConfigurationError } = await import("@/lib/supabase/admin");

    // When: the admin client is created.
    const action = (): void => {
      createAdminClient();
    };

    // Then: a typed configuration failure is raised and no client is created.
    expect(action).toThrow(SupabaseAdminConfigurationError);
    expect(action).toThrow("SUPABASE_URL is required for the Supabase admin client.");
    expect(createClientCalls).toStrictEqual([]);
  });

  it("throws a typed invalid-url failure without exposing the secret", async () => {
    // Given: the backend URL is malformed while a secret is loaded.
    vi.stubEnv("SUPABASE_URL", "not a url");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_must_not_appear");

    const { createAdminClient, SupabaseAdminConfigurationError } = await import("@/lib/supabase/admin");

    // When: the admin client is created.
    const action = (): void => {
      createAdminClient();
    };

    // Then: the failure is typed and the secret value is never included.
    expect(action).toThrow(SupabaseAdminConfigurationError);
    expect(action).toThrow("SUPABASE_URL must be a valid URL for the Supabase admin client.");
    expect(action).not.toThrow("sb_secret_must_not_appear");
    expect(createClientCalls).toStrictEqual([]);
  });

  it("throws a typed missing-secret failure before creating a client", async () => {
    // Given: the backend URL exists but the required secret key is absent.
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");

    const { createAdminClient, SupabaseAdminConfigurationError } = await import("@/lib/supabase/admin");

    // When: the admin client is created.
    const action = (): void => {
      createAdminClient();
    };

    // Then: a typed secret-specific configuration failure is raised.
    expect(action).toThrow(SupabaseAdminConfigurationError);
    expect(action).toThrow("SUPABASE_SECRET_KEY is required for the Supabase admin client.");
    expect(createClientCalls).toStrictEqual([]);
  });

  it("keeps the admin module server-only and independent of session clients", () => {
    // Given: the admin module source.
    const source = readFileSync("lib/supabase/admin.ts", "utf8");

    // When: the source is inspected.
    const firstLine = source.split(/\r?\n/, 1)[0];

    // Then: it starts with the server-only guard and avoids public/session dependencies.
    expect(firstLine).toBe('import "server-only";');
    expect(source).toContain('from "@supabase/supabase-js"');
    const publicEnvPattern = new RegExp(["NEXT", "_PUBLIC|SUPABASE_(ANON|SERVICE", "_ROLE)_KEY"].join(""));
    const sessionClientPattern = new RegExp(
      [`next${"/"}headers`, `@supabase${"/"}ssr`, `cook${"ies?"}\\b`].join("|"),
    );
    expect(source).not.toMatch(publicEnvPattern);
    expect(source).not.toMatch(sessionClientPattern);
  });
});
