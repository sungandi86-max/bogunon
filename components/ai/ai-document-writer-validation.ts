import type {
  ActivityReportFileState,
  AiDocumentWriterFormValues,
} from "@/components/ai/ai-document-writer-types";
import { MAX_ACTIVITY_REPORT_CHARACTERS } from "@/lib/ai/document-writer";

export function aiDocumentWriterValidationMessage(
  values: AiDocumentWriterFormValues,
  activityFileStatus: ActivityReportFileState["status"] | null,
  aiConnected: boolean,
): string | null {
  if (activityFileStatus === "extracting") {
    return "활동보고서 텍스트 추출이 끝날 때까지 기다려 주세요.";
  }
  if (!values.studentId.trim()) return "학생 식별 ID를 입력해 주세요.";
  if (!/^[A-Za-z0-9_-]+$/.test(values.studentId.trim())) {
    return "학생 식별 ID는 영문, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.";
  }
  if (!values.activityReport.trim()) {
    return "활동보고서를 입력하거나 파일로 불러와 주세요.";
  }
  if (Array.from(values.activityReport).length > MAX_ACTIVITY_REPORT_CHARACTERS) {
    return `활동보고서를 ${MAX_ACTIVITY_REPORT_CHARACTERS.toLocaleString("ko-KR")}자 이하로 줄여주세요.`;
  }
  if (!values.privacyConfirmed) {
    return "개인정보를 입력하지 않았다는 확인이 필요합니다.";
  }
  if (!aiConnected) return "설정에서 OpenAI 또는 Gemini를 먼저 연결해 주세요.";
  return null;
}
