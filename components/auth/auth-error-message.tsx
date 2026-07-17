import type { AuthErrorCode } from "@/lib/auth/redirects";
import { getAuthErrorMessage } from "@/lib/auth/messages";

interface AuthErrorMessageProps {
  readonly code: AuthErrorCode | null;
}

export function AuthErrorMessage({ code }: AuthErrorMessageProps) {
  if (!code) return null;
  return <p className="auth-error" role="alert">{getAuthErrorMessage(code)}</p>;
}
