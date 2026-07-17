import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { createLoginPath, getSafeNextPath } from "@/lib/auth/redirects";
import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/supabase/config";
import { supabaseCookieOptions } from "@/lib/supabase/cookies";

const publicPathPrefixes = ["/auth", "/login"] as const;

function isPublicPath(pathname: string): boolean {
  return publicPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function requestedPath(request: NextRequest): string {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!hasSupabaseConfig()) {
    if (isPublicPath(pathname)) return NextResponse.next({ request });
    return NextResponse.redirect(new URL(createLoginPath("configuration"), request.url));
  }

  let response = NextResponse.next({ request });
  const { publishableKey, url } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : data?.claims;
  if (!claims && !isPublicPath(pathname)) {
    const hasSessionCookie = request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
    const loginPath = hasSessionCookie
      ? createLoginPath("sessionExpired", requestedPath(request))
      : "/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (claims && pathname === "/login") {
    const next = getSafeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  return response;
}
