import type { AiDocumentWriterRequest } from "@/lib/ai/document-writer";

export type AiDocumentWriterFormValues =
  Omit<AiDocumentWriterRequest, "privacyConfirmed"> & {
    readonly privacyConfirmed: boolean;
  };

export type StudentMaterialKey = "activityReport" | "selfEvaluation";

export type GuidelineSourceType = "guide" | "correction" | "supplement";

export interface SchoolRecordGuideline {
  readonly academicYear: string;
  readonly fileName: string;
  readonly schoolLevel: "고등학교";
  readonly sourceType: GuidelineSourceType;
  readonly text: string;
}

export const INITIAL_AI_DOCUMENT_VALUES: AiDocumentWriterFormValues = {
  studentId: "",
  activityReport: "",
  selfEvaluation: "",
  teacherMemo: "",
  tone: "objective",
  length: "within-1500-bytes",
  privacyConfirmed: false,
};
