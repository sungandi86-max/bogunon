import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";
import { supabaseCookieOptions } from "@/lib/supabase/cookies";

export function createClient() {
  const { publishableKey, url } = getSupabaseConfig();
  return createBrowserClient(url, publishableKey, { cookieOptions: supabaseCookieOptions });
}
