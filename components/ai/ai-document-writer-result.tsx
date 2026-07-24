import {
  AlertTriangle,
  Check,
  Clipboard,
  PencilLine,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { Ref } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AiDocumentWriterResult } from "@/lib/ai/document-writer";

interface AiDocumentWriterResultProps {
  readonly bytes: number;
  readonly characters: number;
  readonly copyMessage: string;
  readonly isSubmitting: boolean;
  readonly onCopy: () => void;
  readonly onEdit: () => void;
  readonly onRegenerate: () => void;
  readonly result: AiDocumentWriterResult | null;
  readonly resultRef: Ref<HTMLElement>;
}

export function AiDocumentWriterResultPanel({
  bytes,
  characters,
  copyMessage,
  isSubmitting,
  onCopy,
  onEdit,
  onRegenerate,
  result,
  resultRef,
}: AiDocumentWriterResultProps) {
  if (!result) {
    return (
      <section className="ai-writer-empty" aria-labelledby="ai-writer-empty-title">
        <Sparkles aria-hidden="true" size={28} />
        <div>
          <h2 id="ai-writer-empty-title">작성할 자료를 입력해 주세요</h2>
          <p>
            왼쪽에 익명화된 활동 자료와 교사 메모를 입력하면 이곳에 초안과
            분량 정보가 표시됩니다.
          </p>
        </div>
      </section>
    );
  }

  const exceedsLimit = bytes > 1_500;
  return (
    <section className="ai-writer-result" aria-labelledby="ai-writer-result-title" ref={resultRef}>
      <header>
        <div>
          <Badge tone={result.mode === "mock" ? "neutral" : "success"}>
            {result.mode === "mock" ? "예시 초안" : "AI 초안"}
          </Badge>
          <h2 id="ai-writer-result-title">생성된 초안</h2>
        </div>
        <dl className="ai-writer-result__counts">
          <div><dt>글자 수</dt><dd>{characters.toLocaleString("ko-KR")}자</dd></div>
          <div><dt>UTF-8</dt><dd>{bytes.toLocaleString("ko-KR")}바이트</dd></div>
        </dl>
      </header>
      {result.mode === "mock" && (
        <p className="ai-writer-message">
          현재 AI 연결 없이 예시 초안이 표시됐습니다. 실제 운영에서는 AI 연결 설정을 확인해 주세요.
        </p>
      )}
      <div className="ai-writer-result__draft">{result.draft}</div>
      <p
        className={`ai-writer-limit ${exceedsLimit ? "ai-writer-limit--warning" : ""}`}
        role={exceedsLimit ? "alert" : undefined}
      >
        {exceedsLimit
          ? <AlertTriangle aria-hidden="true" size={18} />
          : <Check aria-hidden="true" size={18} />}
        {exceedsLimit
          ? "1500바이트를 초과했습니다. 내용을 줄여주세요."
          : "1500바이트 이내입니다."}
      </p>
      {result.insufficiencyNotice && (
        <p className="ai-writer-message ai-writer-message--notice">
          <AlertTriangle aria-hidden="true" size={18} />
          {result.insufficiencyNotice}
        </p>
      )}
      <div className="ai-writer-result__actions">
        <Button onClick={onCopy}>
          <Clipboard aria-hidden="true" size={18} />
          초안 복사
        </Button>
        <Button disabled={isSubmitting} onClick={onRegenerate} variant="secondary">
          <RefreshCw aria-hidden="true" size={18} />
          다시 생성
        </Button>
        <Button onClick={onEdit} variant="ghost">
          <PencilLine aria-hidden="true" size={18} />
          입력 수정
        </Button>
      </div>
      {copyMessage && (
        <p
          className={`ai-writer-message ${
            copyMessage === "초안을 복사했습니다."
              ? "ai-writer-message--success"
              : "ai-writer-message--error"
          }`}
          role="status"
        >
          {copyMessage}
        </p>
      )}
    </section>
  );
}
