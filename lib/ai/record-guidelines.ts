import { z } from "zod";

export const GUIDELINE_SOURCE_TYPES = [
  "guide",
  "correction",
  "supplement",
  "other",
] as const;

export type GuidelineSourceType = (typeof GUIDELINE_SOURCE_TYPES)[number];

export const GUIDELINE_SOURCE_LABELS: Record<GuidelineSourceType, string> = {
  guide: "학교생활기록부 기재요령",
  correction: "교육부 공식 정오표",
  supplement: "공식 보완자료",
  other: "기타 공개 기준자료",
};

export const GUIDELINE_MAX_CHARACTERS = 100_000;
export const GUIDELINE_MAX_REQUEST_BYTES = 420_000;

export interface RecordGuideline {
  readonly createdAt: string;
  readonly extractedText: string;
  readonly fileSize: number;
  readonly id: string;
  readonly mimeType: "application/pdf" | "text/plain";
  readonly originalFilename: string;
  readonly schoolYear: number;
  readonly sourceType: GuidelineSourceType;
  readonly updatedAt: string;
}

export interface SchoolRecordGuideline {
  readonly academicYear: string;
  readonly fileName: string;
  readonly schoolLevel: "고등학교";
  readonly sourceType: GuidelineSourceType;
  readonly text: string;
}

export const recordGuidelineInputSchema = z.object({
  schoolYear: z.number().int().min(2000).max(2100),
  sourceType: z.enum(GUIDELINE_SOURCE_TYPES),
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.enum(["application/pdf", "text/plain"]),
  extractedText: z.string().trim().min(1).max(GUIDELINE_MAX_CHARACTERS),
  fileSize: z.number().int().positive().max(15 * 1024 * 1024),
}).strict();

export type RecordGuidelineInput = z.infer<typeof recordGuidelineInputSchema>;

interface RecordGuidelineRow {
  readonly created_at: string;
  readonly extracted_text: string;
  readonly file_size: number;
  readonly id: string;
  readonly mime_type: "application/pdf" | "text/plain";
  readonly original_filename: string;
  readonly school_year: number;
  readonly document_type: GuidelineSourceType;
  readonly updated_at: string;
}

export function toRecordGuideline(row: RecordGuidelineRow): RecordGuideline {
  return {
    createdAt: row.created_at,
    extractedText: row.extracted_text,
    fileSize: row.file_size,
    id: row.id,
    mimeType: row.mime_type,
    originalFilename: row.original_filename,
    schoolYear: row.school_year,
    sourceType: row.document_type,
    updatedAt: row.updated_at,
  };
}

export function combineGuidelines(
  guidelines: readonly RecordGuideline[],
  schoolYear: number,
): SchoolRecordGuideline | null {
  const selected = guidelines
    .filter((guideline) => guideline.schoolYear === schoolYear)
    .sort((left, right) =>
      GUIDELINE_SOURCE_TYPES.indexOf(left.sourceType)
      - GUIDELINE_SOURCE_TYPES.indexOf(right.sourceType));

  if (selected.length === 0) return null;

  return {
    academicYear: String(schoolYear),
    fileName: selected.map(({ originalFilename }) => originalFilename).join(", "),
    schoolLevel: "고등학교",
    sourceType: selected[0]!.sourceType,
    text: selected.map((guideline) =>
      `[${GUIDELINE_SOURCE_LABELS[guideline.sourceType]}]\n${guideline.extractedText}`)
      .join("\n\n"),
  };
}

export function safeGuidelineFilename(filename: string): string {
  const normalized = filename
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]+/g, "_")
    .trim();
  return normalized.slice(0, 255) || "기준자료";
}
