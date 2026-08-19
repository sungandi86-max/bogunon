import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateAiDocumentDraft } from "@/lib/ai/document-writer-service";
import { countUtf8Bytes, MAX_SCHOOL_RECORD_BYTES } from "@/lib/ai/document-writer";

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

  it.each([
    ["openai", "gpt-5.6-terra"],
    ["gemini", "gemini-3.6-flash"],
  ] as const)("uses the shared gateway for %s with the server-loaded guideline", async (provider, model) => {
    const result = await generateAiDocumentDraft(
      crypto.randomUUID(),
      {
        provider,
        apiKey: "user-secret-key",
        model,
      },
      {
        academicYear: "2026",
        studentId: "S001",
        activityReport: "건강 캠페인 자료를 분석하고 발표함",
        additionalRecord: "축제 운영 총괄",
        length: "within-1500-bytes",
        privacyConfirmed: true,
        tone: "objective",
      },
      {
        academicYear: "2026",
        fileName: "2026-guide.txt",
        schoolLevel: "고등학교",
        sourceType: "guide",
        text: "공식 기재요령",
      },
    );

    expect(result.mode).toBe(provider);
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ provider }),
      expect.objectContaining({
        prompt: expect.stringContaining("공식 기재요령"),
        schemaName: "bogunon_student_record",
      }),
      expect.any(AbortSignal),
    );
    expect(generateText.mock.calls[0]?.[1]?.prompt).toContain("[공식 기준자료]");
  });

  it("caps an overlong provider draft at 1,500 bytes", async () => {
    generateText.mockResolvedValueOnce({
      draft: `${"가".repeat(600)}. ${"나".repeat(600)}`,
      insufficiencyNotice: null,
      review: { errors: [], needsConfirmation: [], suggestions: [] },
    });

    const result = await generateAiDocumentDraft(
      crypto.randomUUID(),
      { provider: "openai", apiKey: "user-secret-key", model: "gpt-5.6-terra" },
      {
        academicYear: "2026",
        studentId: "S001",
        activityReport: "활동보고서",
        additionalRecord: "",
        length: "within-1500-bytes",
        privacyConfirmed: true,
        tone: "objective",
      },
      {
        academicYear: "2026",
        fileName: "guide.txt",
        schoolLevel: "고등학교",
        sourceType: "guide",
        text: "기준자료",
      },
    );

    expect(countUtf8Bytes(result.draft)).toBeLessThanOrEqual(MAX_SCHOOL_RECORD_BYTES);
  });
});
