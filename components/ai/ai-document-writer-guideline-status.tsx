import { CheckCircle2 } from "lucide-react";

interface AiDocumentWriterGuidelineStatusProps {
  readonly academicYear: string;
  readonly hasGuideline: boolean;
  readonly loading: boolean;
}

export function AiDocumentWriterGuidelineStatus({
  academicYear,
  hasGuideline,
  loading,
}: AiDocumentWriterGuidelineStatusProps) {
  if (loading) return <small>저장된 기준자료를 확인하고 있습니다.</small>;

  if (!hasGuideline) {
    return (
      <small className="ai-writer-guideline-status is-warning">
        {academicYear}학년도 기준자료가 등록되지 않았습니다. 설정에서 기준자료를 먼저 등록해주세요.
      </small>
    );
  }

  return (
    <small className="ai-writer-guideline-status is-ready">
      <CheckCircle2 aria-hidden="true" size={16} />
      {academicYear}학년도 학교생활기록부 기재요령 자동 적용
    </small>
  );
}
