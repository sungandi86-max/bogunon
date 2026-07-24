import { describe, expect, it } from "vitest";

import {
  DocumentTextExtractionError,
  extractTextFile,
} from "@/lib/ai/document-text-extraction";

describe("document text extraction", () => {
  it("extracts UTF-8 TXT content and removes a BOM", async () => {
    const file = new File(["\uFEFF활동 내용\r\n두 번째 줄"], "report.txt", {
      type: "text/plain",
    });

    await expect(extractTextFile(file)).resolves.toBe("활동 내용\n두 번째 줄");
  });

  it("rejects formats that are not explicitly supported", async () => {
    const file = new File(["fake"], "report.pdf", { type: "application/pdf" });

    await expect(extractTextFile(file)).rejects.toMatchObject({
      code: "UNSUPPORTED_TYPE",
    } satisfies Partial<DocumentTextExtractionError>);
  });

  it("rejects empty and oversized TXT files", async () => {
    await expect(extractTextFile(new File(["   "], "empty.txt"))).rejects.toMatchObject({
      code: "EMPTY_FILE",
    } satisfies Partial<DocumentTextExtractionError>);
    await expect(extractTextFile(
      new File(["가".repeat(32)], "large.txt"),
      { maxBytes: 10 },
    )).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
    } satisfies Partial<DocumentTextExtractionError>);
  });
});
