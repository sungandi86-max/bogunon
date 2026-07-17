import type { AuthErrorCode } from "@/lib/auth/redirects";

const authErrorMessages = {
  configuration: "로그인 설정을 확인할 수 없습니다. 관리자에게 문의해 주세요.",
  logout: "로그아웃을 완료하지 못했습니다. 다시 시도해 주세요.",
  oauth: "Google 로그인을 완료하지 못했습니다. 다시 시도해 주세요.",
  session_expired: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
} as const satisfies Record<AuthErrorCode, string>;

export function getAuthErrorMessage(code: AuthErrorCode): string {
  return authErrorMessages[code];
}
