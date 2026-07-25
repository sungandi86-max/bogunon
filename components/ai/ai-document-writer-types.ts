import type { AiDocumentWriterRequest } from "@/lib/ai/document-writer";
import type { DocumentFileFormat } from "@/lib/ai/document-text-extraction";
import type {
  GuidelineSourceType,
  SchoolRecordGuideline,
} from "@/lib/ai/record-guidelines";

export type AiDocumentWriterFormValues =
  Omit<AiDocumentWriterRequest, "guideline" | "privacyConfirmed"> & {
    readonly privacyConfirmed: boolean;
  };

export interface ActivityReportFileState {
  readonly characterCount?: number;
  readonly fileName: string;
  readonly format?: DocumentFileFormat;
  readonly message?: string;
  readonly status: "extracting" | "ready" | "error";
}

export type { GuidelineSourceType, SchoolRecordGuideline };

export const INITIAL_AI_DOCUMENT_VALUES: AiDocumentWriterFormValues = {
  studentId: "",
  activityReport: "",
  additionalRecord: "",
  tone: "objective",
  length: "within-1500-bytes",
  privacyConfirmed: false,
};
