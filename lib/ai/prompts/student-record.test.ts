import { describe, expect, it } from "vitest";

import {
  buildStudentRecordPrompt,
  StudentRecordAiResponseSchema,
} from "@/lib/ai/prompts/student-record";

describe("student record prompt", () => {
  it("keeps source priority, privacy, evidence, and byte-limit rules outside the UI", () => {
    const prompt = buildStudentRecordPrompt({
      studentId: "S001",
      activityReport: "활동보고서 내용",
      additionalRecord: "동아리 회장",
      guideline: {
        academicYear: "2026",
        schoolLevel: "고등학교",
        sourceType: "guide",
        text: "공식 기재요령",
      },
      length: "within-1500-bytes",
      privacyConfirmed: true,
      tone: "objective",
    });

    expect(prompt.userPrompt).toContain("활동보고서 내용");
    expect(prompt.userPrompt).toContain("동아리 회장");
    expect(prompt.userPrompt).toContain("공식 기재요령");
    expect(prompt.systemPrompt).toContain("추가 기록을 우선");
    expect(prompt.systemPrompt).toContain("실명");
    expect(prompt.systemPrompt).toContain("1,500바이트");
  });

  it("rejects an empty or malformed structured response", () => {
    expect(StudentRecordAiResponseSchema.safeParse({ draft: "" }).success).toBe(false);
    expect(StudentRecordAiResponseSchema.safeParse({
      draft: "초안",
      insufficiencyNotice: null,
      review: {
        errors: [],
        needsConfirmation: [],
        suggestions: [],
      },
    }).success).toBe(true);
  });
});
