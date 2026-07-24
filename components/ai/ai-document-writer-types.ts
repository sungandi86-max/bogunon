import type { AiDocumentWriterRequest } from "@/lib/ai/document-writer";

export type AiDocumentWriterFormValues =
  Omit<AiDocumentWriterRequest, "privacyConfirmed"> & {
    readonly privacyConfirmed: boolean;
  };

export const INITIAL_AI_DOCUMENT_VALUES: AiDocumentWriterFormValues = {
  documentType: "club-record",
  studentId: "",
  activityReport: "",
  selfEvaluation: "",
  teacherMemo: "",
  tone: "objective",
  length: "within-1500-bytes",
  privacyConfirmed: false,
};
