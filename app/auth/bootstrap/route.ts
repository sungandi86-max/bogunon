import { NextResponse } from "next/server";

import { getSafeNextPath } from "@/lib/auth/redirects";
import { queueUserSettingsBootstrap } from "@/lib/auth/user-settings-bootstrap";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/login?error=configuration", requestUrl.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=session_expired", requestUrl.origin));
  }

  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  queueUserSettingsBootstrap(response, data.user.id);
  return response;
}
