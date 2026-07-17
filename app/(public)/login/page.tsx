import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <Link className="wordmark" href="/login">
          <span className="wordmark__symbol" aria-hidden="true">온</span>
          보건온
        </Link>
        <h1 id="login-title">오늘의 업무와 일정을 한곳에서 정리하세요.</h1>
        <p className="login-card__description">학교 업무와 개인 일정을 같은 계정으로 안전하게 이어서 관리합니다.</p>
        <Button className="google-button" type="button">
          Google로 로그인
        </Button>
        <p className="login-privacy"><ShieldCheck aria-hidden="true" size={16} /> 학생 이름, 학번, 질병명, 상담 내용 등 개인 건강정보를 입력하지 마세요.</p>
      </section>
    </main>
  );
}
