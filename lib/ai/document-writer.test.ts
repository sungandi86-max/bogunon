import { describe, expect, it } from "vitest";

import {
  AiDocumentWriterRequestSchema,
  countCharacters,
  countUtf8Bytes,
  MAX_SCHOOL_RECORD_BYTES,
  truncateUtf8Bytes,
} from "@/lib/ai/document-writer";
import { buildStudentRecordPrompt } from "@/lib/ai/prompts/student-record";

const validRequest = {
  academicYear: "2026",
  studentId: "S001",
  activityReport: "건강 캠페인 자료를 조사하고 모둠 토의를 거쳐 발표 자료를 정리한 뒤 발표함",
  additionalRecord: "",
  tone: "objective",
  length: "within-1500-bytes",
  privacyConfirmed: true,
} as const;

describe("AI document writer domain", () => {
  it("requires an anonymous ID, consent, and an activity report", () => {
    expect(AiDocumentWriterRequestSchema.safeParse(validRequest).success).toBe(true);
    expect(AiDocumentWriterRequestSchema.safeParse({
      ...validRequest,
      studentId: "",
    }).success).toBe(false);
    expect(AiDocumentWriterRequestSchema.safeParse({
      ...validRequest,
      activityReport: "",
    }).success).toBe(false);
    expect(AiDocumentWriterRequestSchema.safeParse({
      ...validRequest,
      privacyConfirmed: false,
    }).success).toBe(false);
  });

  it("counts Unicode characters and UTF-8 bytes independently", () => {
    expect(countCharacters("보건A")).toBe(3);
    expect(countUtf8Bytes("보건A")).toBe(7);
  });

  it("builds a grounded privacy-first prompt without legacy self-evaluation fields", () => {
    const requestWithAdditionalRecord = {
      ...validRequest,
      additionalRecord: "축제 부스 운영을 총괄함",
    };
    const prompt = buildStudentRecordPrompt({
      ...requestWithAdditionalRecord,
      guideline: {
        academicYear: "2026",
        schoolLevel: "고등학교",
        sourceType: "guide",
        text: "공식 기재요령",
      },
    });
    expect(prompt.systemPrompt).toContain("학생 활동보고서는 충분한 기본 근거 자료입니다");
    expect(prompt.systemPrompt).toContain("추가 기록이 없어도 활동보고서의 사실만으로 정상적인 초안");
    expect(prompt.systemPrompt).toContain("기록한 서술형 문체");
    expect(prompt.systemPrompt).toContain("입력 자료에 실제로 적힌 사실만 사용하세요");
    expect(prompt.systemPrompt).toContain("실명을 추론하거나 생성하지 마세요");
    expect(prompt.userPrompt).toContain("[공식 기준자료]");
    expect(prompt.userPrompt).toContain("[학생 활동보고서]");
    expect(prompt.userPrompt).toContain("[활동보고서 해석 원칙]");
    expect(prompt.userPrompt).toContain("[추가 기록 (선택)]");
    expect(prompt.userPrompt).toContain("S001");
    expect(prompt.userPrompt).toContain("축제 부스 운영을 총괄함");
    expect(AiDocumentWriterRequestSchema.safeParse({
      ...validRequest,
      selfEvaluation: "별도 자기평가",
    }).success).toBe(false);

  });

  it("keeps the generated draft within the Korean record byte limit", () => {
    const value = `${"가".repeat(400)}. ${"나".repeat(400)}`;
    const truncated = truncateUtf8Bytes(value, MAX_SCHOOL_RECORD_BYTES);

    expect(countUtf8Bytes(truncated)).toBeLessThanOrEqual(MAX_SCHOOL_RECORD_BYTES);
    expect(truncated.endsWith(".")).toBe(true);
  });
});
