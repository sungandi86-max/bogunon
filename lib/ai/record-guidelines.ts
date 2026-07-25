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
export const GUIDELINE_MAX_COMBINED_CHARACTERS = 100_000;
export const GUIDELINE_MAX_REQUEST_BYTES = 420_000;

const persistedGuidelinePrivacyPatterns = [
  /\d{6}[-\s]?[1-4]\d{6}/,
  /(?:연락처|전화(?:번호)?|휴대폰)\s*[:#-]?\s*0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/i,
  /(?:학생\s*)?(?:이름|성명)\s*[:#-]\s*[가-힣]{2,4}(?=\s|$|[,.;])/,
  /\d{1,2}학년\s*\d{1,2}반\s*\d{1,2}번/,
] as const;

export class GuidelineContainsPersonalDataError extends Error {
  constructor() {
    super("학생 개인정보로 보이는 내용이 있어 기준자료를 저장하지 않았습니다.");
    this.name = "GuidelineContainsPersonalDataError";
  }
}

export class GuidelineYearTextLimitError extends Error {
  constructor() {
    super("같은 학년도의 기준자료 합계가 100,000자를 초과합니다. 기존 자료를 줄이거나 교체해 주세요.");
    this.name = "GuidelineYearTextLimitError";
  }
}

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
  originalFilename: z.string().trim().min(1).max(255).transform(safeGuidelineFilename),
  mimeType: z.enum(["application/pdf", "text/plain"]),
  extractedText: z.string().trim().min(1).max(GUIDELINE_MAX_CHARACTERS),
  fileSize: z.number().int().positive().max(15 * 1024 * 1024),
}).strict();

export type RecordGuidelineInput = z.infer<typeof recordGuidelineInputSchema>;

export const recordGuidelineSchema = z.object({
  createdAt: z.string().datetime({ offset: true }),
  extractedText: z.string().min(1).max(GUIDELINE_MAX_CHARACTERS),
  fileSize: z.number().int().positive().max(15 * 1024 * 1024),
  id: z.string().uuid(),
  mimeType: z.enum(["application/pdf", "text/plain"]),
  originalFilename: z.string().min(1).max(255),
  schoolYear: z.number().int().min(2000).max(2100),
  sourceType: z.enum(GUIDELINE_SOURCE_TYPES),
  updatedAt: z.string().datetime({ offset: true }),
}).strict();

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

export function assertGuidelineCanBePersisted(extractedText: string): void {
  if (persistedGuidelinePrivacyPatterns.some((pattern) => pattern.test(extractedText))) {
    throw new GuidelineContainsPersonalDataError();
  }
}
