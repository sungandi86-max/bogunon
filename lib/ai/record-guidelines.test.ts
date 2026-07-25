import { describe, expect, it } from "vitest";

import {
  combineGuidelines,
  recordGuidelineInputSchema,
  type RecordGuideline,
} from "@/lib/ai/record-guidelines";

function guideline(overrides: Partial<RecordGuideline> = {}): RecordGuideline {
  return {
    createdAt: "2026-07-25T00:00:00Z",
    extractedText: "공식 기준",
    fileSize: 100,
    id: crypto.randomUUID(),
    mimeType: "text/plain",
    originalFilename: "guide.txt",
    schoolYear: 2026,
    sourceType: "guide",
    updatedAt: "2026-07-25T00:00:00Z",
    ...overrides,
  };
}

describe("record guidelines", () => {
  it("combines only the selected year in official source order", () => {
    const combined = combineGuidelines([
      guideline({ schoolYear: 2025, extractedText: "지난 기준" }),
      guideline({ sourceType: "supplement", extractedText: "보완" }),
      guideline({ sourceType: "guide", extractedText: "기재요령" }),
    ], 2026);

    expect(combined?.text).toBe(
      "[학교생활기록부 기재요령]\n기재요령\n\n[공식 보완자료]\n보완",
    );
    expect(combined?.text).not.toContain("지난 기준");
  });

  it("rejects student fields and oversized extracted text", () => {
    expect(() => recordGuidelineInputSchema.parse({
      schoolYear: 2026,
      sourceType: "guide",
      originalFilename: "guide.txt",
      mimeType: "text/plain",
      extractedText: "기준",
      fileSize: 10,
      activityReport: "학생 원문",
    })).toThrow();

    expect(() => recordGuidelineInputSchema.parse({
      schoolYear: 2026,
      sourceType: "guide",
      originalFilename: "guide.txt",
      mimeType: "text/plain",
      extractedText: "가".repeat(100_001),
      fileSize: 10,
    })).toThrow();
  });
});
