import { NextResponse } from "next/server";

import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  const origin = new URL(request.url).origin;
  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/login?error=configuration", origin), 303);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  const destination = error ? "/login?error=logout" : "/login";
  return NextResponse.redirect(new URL(destination, origin), 303);
}
