import { ShieldCheck } from "lucide-react";

export function AiDocumentWriterPrivacyNotice() {
  return (
    <aside className="ai-writer-privacy" aria-labelledby="ai-writer-privacy-title">
      <ShieldCheck aria-hidden="true" size={22} />
      <div>
        <strong id="ai-writer-privacy-title">개인정보를 입력하지 마세요.</strong>
        <p>입력한 내용과 생성 결과는 저장되지 않습니다.</p>
      </div>
    </aside>
  );
}
