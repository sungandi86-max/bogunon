import { LoaderCircle, Sparkles } from "lucide-react";

import { AiDocumentWriterGuidelineStatus } from "@/components/ai/ai-document-writer-guideline-status";
import { Button } from "@/components/ui/button";
import { MAX_ACTIVITY_REPORT_CHARACTERS } from "@/lib/ai/document-writer";

interface AiDocumentWriterSubmitProps {
  readonly academicYear: string;
  readonly activityReportExtracting: boolean;
  readonly activityReportLength: number;
  readonly activityReportMissing: boolean;
  readonly activityReportTooLong: boolean;
  readonly aiConnected: boolean;
  readonly guidelineBusy: boolean;
  readonly guidelineLoading: boolean;
  readonly hasGuideline: boolean;
  readonly isSubmitting: boolean;
}

export function AiDocumentWriterSubmit({
  academicYear,
  activityReportExtracting,
  activityReportLength,
  activityReportMissing,
  activityReportTooLong,
  aiConnected,
  guidelineBusy,
  guidelineLoading,
  hasGuideline,
  isSubmitting,
}: AiDocumentWriterSubmitProps) {
  return (
    <div className="ai-writer-submit">
      <div>
        <AiDocumentWriterGuidelineStatus
          academicYear={academicYear}
          hasGuideline={hasGuideline}
          loading={guidelineLoading}
        />
        {activityReportMissing && <small>활동보고서를 입력하거나 파일로 불러오면 생성할 수 있습니다.</small>}
        {!aiConnected && <small>AI 연결 후 실제 초안을 생성할 수 있습니다.</small>}
        {activityReportExtracting && <small>파일에서 텍스트를 추출하고 있습니다.</small>}
        {activityReportTooLong && (
          <small className="is-warning">
            활동보고서가 {activityReportLength.toLocaleString("ko-KR")}자입니다.
            내용을 {MAX_ACTIVITY_REPORT_CHARACTERS.toLocaleString("ko-KR")}자 이하로 줄여주세요.
          </small>
        )}
      </div>
      <Button
        disabled={
          isSubmitting
          || !aiConnected
          || guidelineBusy
          || !hasGuideline
          || activityReportExtracting
          || activityReportMissing
          || activityReportTooLong
        }
        type="submit"
      >
        {isSubmitting
          ? <LoaderCircle aria-hidden="true" className="ai-writer-spinner" size={18} />
          : <Sparkles aria-hidden="true" size={18} />}
        {isSubmitting ? "초안 생성 중" : "생기부 초안 생성"}
      </Button>
    </div>
  );
}
