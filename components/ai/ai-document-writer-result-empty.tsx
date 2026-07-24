import { CheckCircle2, Circle, Sparkles } from "lucide-react";

interface AiDocumentWriterResultEmptyProps {
  readonly activityReportReady: boolean;
  readonly hasAdditionalRecord: boolean;
  readonly hasGuideline: boolean;
  readonly studentIdReady: boolean;
}

export function AiDocumentWriterResultEmpty({
  activityReportReady,
  hasAdditionalRecord,
  hasGuideline,
  studentIdReady,
}: AiDocumentWriterResultEmptyProps) {
  const statuses = [
    { complete: studentIdReady, label: "익명 학생 ID 입력" },
    { complete: activityReportReady, label: "활동보고서 준비" },
    {
      complete: hasAdditionalRecord,
      label: hasAdditionalRecord ? "추가 기록 준비" : "추가 기록 없음 · 선택 사항",
    },
    {
      complete: hasGuideline,
      label: hasGuideline ? "공식 기재요령 적용" : "공식 기재요령 없음 · 일반 점검만 가능",
    },
  ] as const;

  return (
    <section className="ai-writer-empty" aria-labelledby="ai-writer-empty-title">
      <header>
        <Sparkles aria-hidden="true" size={24} />
        <div>
          <h2 id="ai-writer-empty-title">동아리 생활기록부 초안</h2>
          <p>입력부터 복사까지 한 화면에서 진행합니다.</p>
        </div>
      </header>
      <ol className="ai-writer-workflow">
        <li>활동보고서 입력</li>
        <li>필요한 경우 추가 기록 입력</li>
        <li>초안 생성</li>
        <li>기재 내용 점검</li>
        <li>1,500바이트 확인 후 복사</li>
      </ol>
      <div className="ai-writer-readiness" aria-label="입력 준비 상태">
        {statuses.map((status) => (
          <p className={status.complete ? "is-complete" : ""} key={status.label}>
            {status.complete
              ? <CheckCircle2 aria-hidden="true" size={18} />
              : <Circle aria-hidden="true" size={18} />}
            {status.label}
          </p>
        ))}
      </div>
    </section>
  );
}
