import { describe, expect, it } from "vitest";

import {
  AiDocumentWriterRequestSchema,
  countCharacters,
  countUtf8Bytes,
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
    expect(prompt.systemPrompt).toContain("입력에 없는 활동·성과·태도·역량을 추측하거나 만들지 마세요");
    expect(prompt.systemPrompt).toContain("추가 기록을 우선");
    expect(prompt.systemPrompt).toContain("학생 자기평가의 주관적 표현을 교사의 직접 관찰 사실처럼 바꾸지 마세요");
    expect(prompt.systemPrompt).toContain("실명을 추론하거나 생성하지 마세요");
    expect(prompt.userPrompt).toContain("[공식 기준자료]");
    expect(prompt.userPrompt).toContain("[학생 활동보고서]");
    expect(prompt.userPrompt).toContain("[학생 자기평가]");
    expect(prompt.userPrompt).toContain("[교사 메모]");
    expect(prompt.userPrompt).toContain("S001");
    expect(prompt.userPrompt).toContain("축제 부스 운영을 총괄함");
    expect(AiDocumentWriterRequestSchema.safeParse({
      ...validRequest,
      selfEvaluation: "별도 자기평가",
    }).success).toBe(false);

  });
});
