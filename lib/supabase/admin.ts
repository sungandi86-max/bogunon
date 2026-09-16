import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const supabaseAdminConfigurationErrorCodes = {
  invalidUrl: "invalid-url",
  missingSecretKey: "missing-secret-key",
  missingUrl: "missing-url",
} as const;

export type SupabaseAdminConfigurationErrorCode =
  (typeof supabaseAdminConfigurationErrorCodes)[keyof typeof supabaseAdminConfigurationErrorCodes];

export type SupabaseAdminEnvVar = "SUPABASE_SECRET_KEY" | "SUPABASE_URL";

const failureDetails = {
  [supabaseAdminConfigurationErrorCodes.invalidUrl]: {
    envVar: "SUPABASE_URL",
    message: "SUPABASE_URL must be a valid URL for the Supabase admin client.",
  },
  [supabaseAdminConfigurationErrorCodes.missingSecretKey]: {
    envVar: "SUPABASE_SECRET_KEY",
    message: "SUPABASE_SECRET_KEY is required for the Supabase admin client.",
  },
  [supabaseAdminConfigurationErrorCodes.missingUrl]: {
    envVar: "SUPABASE_URL",
    message: "SUPABASE_URL is required for the Supabase admin client.",
  },
} as const satisfies Record<
  SupabaseAdminConfigurationErrorCode,
  { readonly envVar: SupabaseAdminEnvVar; readonly message: string }
>;

export class SupabaseAdminConfigurationError extends Error {
  readonly code: SupabaseAdminConfigurationErrorCode;
  readonly envVar: SupabaseAdminEnvVar;
  readonly name = "SupabaseAdminConfigurationError";

  constructor(code: SupabaseAdminConfigurationErrorCode) {
    const failure = failureDetails[code];
    super(failure.message);
    this.code = code;
    this.envVar = failure.envVar;
  }
}

const adminClientOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
} as const;

export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env["SUPABASE_URL"];
  const secretKey = process.env["SUPABASE_SECRET_KEY"];

  if (!url) {
    throw new SupabaseAdminConfigurationError(supabaseAdminConfigurationErrorCodes.missingUrl);
  }

  if (!URL.canParse(url)) {
    throw new SupabaseAdminConfigurationError(supabaseAdminConfigurationErrorCodes.invalidUrl);
  }

  if (!secretKey) {
    throw new SupabaseAdminConfigurationError(supabaseAdminConfigurationErrorCodes.missingSecretKey);
  }

  return createClient<Database>(url, secretKey, adminClientOptions);
}
