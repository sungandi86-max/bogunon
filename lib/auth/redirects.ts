const loginErrorByReason = {
  configuration: "configuration",
  logout: "logout",
  oauth: "oauth",
  sessionExpired: "session_expired",
} as const;

export type AuthFailureReason = keyof typeof loginErrorByReason;
export type AuthErrorCode = (typeof loginErrorByReason)[AuthFailureReason];

export function getSafeNextPath(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/briefing";
  }
  return value;
}

export function createLoginPath(reason: AuthFailureReason, next?: string): string {
  const parameters = new URLSearchParams({ error: loginErrorByReason[reason] });
  if (next) parameters.set("next", getSafeNextPath(next));
  return `/login?${parameters.toString()}`;
}

export function parseAuthErrorCode(value: string | undefined): AuthErrorCode | null {
  const codes = Object.values(loginErrorByReason);
  return codes.find((code) => code === value) ?? null;
}
