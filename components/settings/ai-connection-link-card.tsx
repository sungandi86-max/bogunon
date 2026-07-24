import { ArrowRight, PlugZap } from "lucide-react";
import Link from "next/link";

export function AiConnectionLinkCard() {
  return (
    <section className="settings-card">
      <div className="settings-card__heading">
        <PlugZap aria-hidden="true" size={20} />
        <div>
          <h2>AI 연결</h2>
          <p>개인 OpenAI 또는 Gemini API를 현재 탭에 연결합니다.</p>
        </div>
      </div>
      <Link className="button button--secondary" href="/settings/ai">
        AI 연결 설정
        <ArrowRight aria-hidden="true" size={17} />
      </Link>
    </section>
  );
}
