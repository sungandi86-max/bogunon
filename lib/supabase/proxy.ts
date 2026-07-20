import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { createLoginPath, getSafeNextPath } from "@/lib/auth/redirects";
import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/supabase/config";
import { supabaseCookieOptions } from "@/lib/supabase/cookies";

const publicPathPrefixes = ["/auth", "/login", "/privacy", "/terms"] as const;
const publicPwaPaths = new Set([
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/sw.js",
  "/offline",
  "/offline.html",
]);
const publicAssetPrefixes = ["/_next/static/", "/_next/image/", "/images/", "/public/"] as const;

function isPublicPath(pathname: string): boolean {
  return publicPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicLegalPath(pathname: string): boolean {
  return pathname === "/privacy" || pathname.startsWith("/privacy/") || pathname === "/terms" || pathname.startsWith("/terms/");
}

function isPublicAssetPath(pathname: string): boolean {
  return publicPwaPaths.has(pathname) || publicAssetPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function requestedPath(request: NextRequest): string {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

function createNextResponse(request: NextRequest, requestHeaders?: Headers): NextResponse {
  if (requestHeaders) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return NextResponse.next({ request });
}

export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  const pathname = request.nextUrl.pathname;
  if (isPublicAssetPath(pathname)) return createNextResponse(request, requestHeaders);
  if (isPublicLegalPath(pathname)) return createNextResponse(request, requestHeaders);
  if (!hasSupabaseConfig()) {
    if (isPublicPath(pathname)) return createNextResponse(request, requestHeaders);
    return NextResponse.redirect(new URL(createLoginPath("configuration"), request.url));
  }

  let response = createNextResponse(request, requestHeaders);
  const { publishableKey, url } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = createNextResponse(request, requestHeaders);
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;
  if (!user && !isPublicPath(pathname)) {
    const hasSessionCookie = request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
    const loginPath = hasSessionCookie
      ? createLoginPath("sessionExpired", requestedPath(request))
      : "/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (user && pathname === "/login") {
    const next = getSafeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  return response;
}
