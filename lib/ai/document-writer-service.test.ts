import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateAiDocumentDraft } from "@/lib/ai/document-writer-service";

const { generateText } = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

vi.mock("@/lib/ai/gateway", () => ({
  aiGateway: { generateText },
}));

describe("generateAiDocumentDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateText.mockResolvedValue({
      draft: "건강 캠페인 자료를 분석하고 발표함.",
      insufficiencyNotice: null,
      review: {
        errors: [],
        needsConfirmation: [],
        suggestions: [],
      },
    });
  });

  it("uses the shared gateway with the user's provider and official guideline", async () => {
    const result = await generateAiDocumentDraft(
      crypto.randomUUID(),
      {
        provider: "gemini",
        apiKey: "user-secret-key",
        model: "gemini-3.6-flash",
      },
      {
        studentId: "S001",
        activityReport: "건강 캠페인 자료를 분석하고 발표함",
        additionalRecord: "축제 운영 총괄",
        guideline: {
          academicYear: "2026",
          schoolLevel: "고등학교",
          sourceType: "guide",
          text: "공식 기재요령",
        },
        length: "within-1500-bytes",
        privacyConfirmed: true,
        tone: "objective",
      },
    );

    expect(result.mode).toBe("gemini");
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "gemini" }),
      expect.objectContaining({
        prompt: expect.stringContaining("공식 기재요령"),
        schemaName: "bogunon_student_record",
      }),
      expect.any(AbortSignal),
    );
  });
});
