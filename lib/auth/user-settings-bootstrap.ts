import type { NextResponse } from "next/server";

import { supabaseCookieOptions } from "@/lib/supabase/cookies";

export const userSettingsBootstrapCookie = "bogunon-user-settings-bootstrap";

export function queueUserSettingsBootstrap(
  response: NextResponse,
  userId: string,
): void {
  if (!userId.trim()) {
    throw new Error("An authenticated user is required to initialize settings.");
  }

  response.cookies.set(userSettingsBootstrapCookie, "required", {
    ...supabaseCookieOptions,
    httpOnly: true,
    maxAge: 10 * 60,
  });
}
