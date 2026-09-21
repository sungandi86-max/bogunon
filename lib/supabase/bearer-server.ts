import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

const bearerPattern = /^Bearer ([^\s,]+)$/i;
const serverAuthOptions = {
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: false,
} as const;

export class DesktopBearerUnauthorizedError extends Error {
  readonly name = "DesktopBearerUnauthorizedError";

  constructor() {
    super("로그인이 필요합니다.");
  }
}

export type DesktopBearerContext = {
  readonly supabase: SupabaseClient<Database>;
  readonly userId: string;
};

function parseBearerToken(authorization: string | null): string {
  const token = authorization?.match(bearerPattern)?.[1];
  if (!token) throw new DesktopBearerUnauthorizedError();
  return token;
}

export async function createDesktopBearerContext(
  authorization: string | null,
): Promise<DesktopBearerContext> {
  const token = parseBearerToken(authorization);
  const { publishableKey, url } = getSupabaseConfig();
  const authClient = createClient<Database>(url, publishableKey, { auth: serverAuthOptions });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new DesktopBearerUnauthorizedError();

  const supabase = createClient<Database>(url, publishableKey, {
    auth: serverAuthOptions,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { supabase, userId: data.user.id };
}
