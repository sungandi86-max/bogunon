import { NextResponse } from "next/server";

import { getSafeNextPath } from "@/lib/auth/redirects";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/login?error=configuration", requestUrl.origin));
  }

  if (!code || requestUrl.searchParams.has("error")) {
    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
  }

  const bootstrapUrl = new URL("/auth/bootstrap", requestUrl.origin);
  bootstrapUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(bootstrapUrl);
}
