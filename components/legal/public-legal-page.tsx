import Link from "next/link";
import type { ReactNode } from "react";

import { BogunonBrand } from "@/components/brand/bogunon-brand";

interface PublicLegalPageProps {
  readonly children: ReactNode;
  readonly description: string;
  readonly title: string;
  readonly updatedAt: string;
}

export function PublicLegalPage({ children, description, title, updatedAt }: PublicLegalPageProps) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header__inner">
          <BogunonBrand className="wordmark" href="/login" priority />
          <nav aria-label="법적 고지">
            <Link aria-label="개인정보처리방침 보기" href="/privacy">개인정보처리방침</Link>
            <Link aria-label="이용약관 보기" href="/terms">이용약관</Link>
            <Link className="legal-header__login" href="/login">로그인</Link>
          </nav>
        </div>
      </header>
      <main className="legal-shell">
        <article className="legal-document">
          <header className="legal-document__title">
            <p>BOGUNON 법적 고지</p>
            <h1>{title}</h1>
            <p>{description}</p>
            <time dateTime={updatedAt}>시행일: {updatedAt.replaceAll("-", ". ")}</time>
          </header>
          {children}
        </article>
      </main>
      <footer className="legal-footer">
        <p>문의: <a aria-label="BOGUNON 문의 이메일" href="mailto:sungandi@sen.go.kr">sungandi@sen.go.kr</a></p>
      </footer>
    </div>
  );
}
