import type { AiDocumentWriterRequest } from "@/lib/ai/document-writer";
import type { DocumentFileFormat } from "@/lib/ai/document-text-extraction";

export type AiDocumentWriterFormValues =
  Omit<AiDocumentWriterRequest, "privacyConfirmed"> & {
    readonly privacyConfirmed: boolean;
  };

export type GuidelineSourceType = "guide" | "correction" | "supplement";

export interface ActivityReportFileState {
  readonly characterCount?: number;
  readonly fileName: string;
  readonly format?: DocumentFileFormat;
  readonly message?: string;
  readonly status: "extracting" | "ready" | "error";
}

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
  additionalRecord: "",
  tone: "objective",
  length: "within-1500-bytes",
  privacyConfirmed: false,
};
