import { ShieldCheck } from "lucide-react";

import { AuthErrorMessage } from "@/components/auth/auth-error-message";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { BogunonBrand } from "@/components/brand/bogunon-brand";
import { getSafeNextPath, parseAuthErrorCode } from "@/lib/auth/redirects";
import { hasSupabaseConfig } from "@/lib/supabase/config";

interface LoginPageProps {
  readonly searchParams: Promise<{
    readonly error?: string;
    readonly next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const parameters = await searchParams;
  const configured = hasSupabaseConfig();
  const errorCode = configured ? parseAuthErrorCode(parameters.error) : "configuration";
  const nextPath = getSafeNextPath(parameters.next ?? null);

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <BogunonBrand className="wordmark" href="/login" priority size="large" />
        <h1 id="login-title">일정과 업무를 한곳에서 관리하세요.</h1>
        <AuthErrorMessage code={errorCode} />
        <GoogleLoginButton disabled={!configured} nextPath={nextPath} />
        <p className="login-privacy"><ShieldCheck aria-hidden="true" size={16} /> 학생 이름, 학번, 질병명, 상담 내용 등 개인 건강정보를 입력하지 마세요.</p>
      </section>
    </main>
  );
}
