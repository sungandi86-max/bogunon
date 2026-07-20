export type SupabaseConfig = {
  readonly publishableKey: string;
  readonly url: string;
};

export class SupabaseConfigurationError extends Error {
  readonly name = "SupabaseConfigurationError";

  constructor() {
    super("Supabase public configuration is unavailable.");
  }
}

export function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && URL.canParse(url) && publishableKey);
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !URL.canParse(url) || !publishableKey) {
    throw new SupabaseConfigurationError();
  }
  return { publishableKey, url };
}
