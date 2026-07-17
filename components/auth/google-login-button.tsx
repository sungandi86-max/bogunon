"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { AuthErrorCode } from "@/lib/auth/redirects";
import { getSafeNextPath } from "@/lib/auth/redirects";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";
import { SupabaseConfigurationError } from "@/lib/supabase/config";

interface GoogleLoginButtonProps {
  readonly disabled?: boolean;
  readonly nextPath: string;
}

export function GoogleLoginButton({ disabled = false, nextPath }: GoogleLoginButtonProps) {
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  async function startLogin(): Promise<void> {
    setErrorCode(null);
    setPending(true);

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", getSafeNextPath(nextPath));
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() },
      });

      if (error) {
        setErrorCode("oauth");
        setPending(false);
      }
    } catch (error) {
      setErrorCode(error instanceof SupabaseConfigurationError ? "configuration" : "oauth");
      setPending(false);
    }
  }

  return (
    <>
      <Button
        className="google-button"
        disabled={disabled || pending}
        onClick={startLogin}
        type="button"
      >
        {pending ? "Google 로그인 중" : "Google로 로그인"}
      </Button>
      {errorCode && <p className="auth-error" role="alert">{getAuthErrorMessage(errorCode)}</p>}
    </>
  );
}
