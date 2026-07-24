import { readFile } from "node:fs/promises";
import path from "node:path";

import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";

import {
  DOCUMENT_UPLOAD_ACCEPT,
  DocumentTextExtractionError,
  extractDocumentText,
} from "@/lib/ai/document-text-extraction";

const FIXTURE_DIRECTORY = path.join(process.cwd(), "test", "fixtures", "ai-writer");

function arrayBufferFrom(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function fixtureFile(name: string, type: string): Promise<File> {
  const bytes = await readFile(path.join(FIXTURE_DIRECTORY, name));
  return new File([arrayBufferFrom(bytes)], name, { type });
}

async function docxFile(documentBody: string, name = "report.docx"): Promise<File> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/word/document.xml"
        ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    </Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1"
        Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
        Target="word/document.xml"/>
    </Relationships>`);
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>${documentBody}</w:body>
    </w:document>`);
  const bytes = await zip.generateAsync({ type: "uint8array" });
  return new File([arrayBufferFrom(bytes)], name, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

async function hwpxFile(): Promise<File> {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8"?>
    <hp:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
      <hp:p><hp:run><hp:t>첫 번째 문단</hp:t></hp:run></hp:p>
      <hp:p><hp:run><hp:t>표 앞 문단</hp:t></hp:run>
        <hp:tbl><hp:tr><hp:tc><hp:subList>
          <hp:p><hp:run><hp:t>표 안의 내용</hp:t></hp:run></hp:p>
        </hp:subList></hp:tc></hp:tr></hp:tbl>
      </hp:p>
    </hp:sec>`);
  zip.file("Contents/section1.xml", `<?xml version="1.0" encoding="UTF-8"?>
    <hp:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
      <hp:p><hp:run><hp:t>두 번째 섹션</hp:t></hp:run></hp:p>
    </hp:sec>`);
  const bytes = await zip.generateAsync({ type: "uint8array" });
  return new File([arrayBufferFrom(bytes)], "report.hwpx", { type: "application/vnd.hancom.hwpx" });
}

describe("document text extraction", () => {
  it("accepts the Windows HWPX MIME type", () => {
    expect(DOCUMENT_UPLOAD_ACCEPT).toContain("application/haansofthwpx");
  });

  it("extracts UTF-8 TXT content, removes a BOM, and normalizes line endings", async () => {
    const file = new File(["\uFEFF활동 내용\r\n두 번째 줄\r세 번째 줄"], "report.txt", {
      type: "text/plain",
    });

    await expect(extractDocumentText(file)).resolves.toEqual({
      format: "txt",
      text: "활동 내용\n두 번째 줄\n세 번째 줄",
    });
  });

  it("extracts DOCX paragraphs and table text in document order", async () => {
    const file = await docxFile(`
      <w:p><w:r><w:t>첫 번째 문단</w:t></w:r></w:p>
      <w:p><w:r><w:t>두 번째 문단</w:t></w:r></w:p>
      <w:tbl><w:tr>
        <w:tc><w:p><w:r><w:t>표 첫 칸</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>표 둘째 칸</w:t></w:r></w:p></w:tc>
      </w:tr></w:tbl>
    `);

    const result = await extractDocumentText(file);

    expect(result.format).toBe("docx");
    expect(result.text).toContain("첫 번째 문단\n\n두 번째 문단");
    expect(result.text).toContain("표 첫 칸");
    expect(result.text).toContain("표 둘째 칸");
  });

  it("reports an empty DOCX instead of treating it as a successful upload", async () => {
    const file = await docxFile("<w:p/>", "empty.docx");

    await expect(extractDocumentText(file)).rejects.toMatchObject({
      code: "EMPTY_FILE",
    } satisfies Partial<DocumentTextExtractionError>);
  });

  it("extracts Korean text from a multi-page PDF in page order", async () => {
    const file = await fixtureFile("korean-multipage.pdf", "application/pdf");

    const result = await extractDocumentText(file);

    expect(result.format).toBe("pdf");
    expect(result.text).toContain("동아리 활동보고서");
    expect(result.text).toContain("첫 번째 페이지");
    expect(result.text.indexOf("첫 번째 페이지")).toBeLessThan(result.text.indexOf("두 번째 페이지"));
  }, 15_000);

  it("distinguishes a text-free PDF from a damaged PDF", async () => {
    await expect(extractDocumentText(
      await fixtureFile("scan-no-text.pdf", "application/pdf"),
    )).rejects.toMatchObject({
      code: "NO_TEXT",
    } satisfies Partial<DocumentTextExtractionError>);
    await expect(extractDocumentText(
      new File(["not a pdf"], "damaged.pdf", { type: "application/pdf" }),
    )).rejects.toMatchObject({
      code: "READ_FAILED",
    } satisfies Partial<DocumentTextExtractionError>);
  });

  it("extracts HWPX sections and paragraphs in order", async () => {
    const result = await extractDocumentText(await hwpxFile());

    expect(result.format).toBe("hwpx");
    expect(result.text).toContain("첫 번째 문단");
    expect(result.text.indexOf("첫 번째 문단")).toBeLessThan(result.text.indexOf("두 번째 섹션"));
  });

  it("extracts table cells from a standard HWPX sample", async () => {
    const result = await extractDocumentText(
      await fixtureFile("table-text.hwpx", "application/haansofthwpx"),
    );

    expect(result.text).toContain("기부 금액");
    expect(result.text).toContain("2023년");
    expect(result.text).toContain("2024년 대비 증감");
  });

  it("extracts text from a standard HWP 5.0 sample and rejects a damaged HWP", async () => {
    const result = await extractDocumentText(
      await fixtureFile("standard-unicode.hwp", "application/x-hwp"),
    );

    expect(result.format).toBe("hwp");
    expect(result.text).toContain("각 항목에 명시되어 있는");
    await expect(extractDocumentText(
      new File(["damaged"], "damaged.hwp", { type: "application/x-hwp" }),
    )).rejects.toMatchObject({
      code: "READ_FAILED",
    } satisfies Partial<DocumentTextExtractionError>);
  });

  it("rejects unsupported extensions, MIME mismatches, and oversized files", async () => {
    await expect(extractDocumentText(
      new File(["fake"], "report.rtf", { type: "application/rtf" }),
    )).rejects.toMatchObject({
      code: "UNSUPPORTED_TYPE",
    } satisfies Partial<DocumentTextExtractionError>);
    await expect(extractDocumentText(
      new File(["fake"], "report.pdf", { type: "text/plain" }),
    )).rejects.toMatchObject({
      code: "MIME_MISMATCH",
    } satisfies Partial<DocumentTextExtractionError>);
    await expect(extractDocumentText(
      new File(["가".repeat(32)], "large.txt", { type: "text/plain" }),
      { maxBytes: 10 },
    )).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
    } satisfies Partial<DocumentTextExtractionError>);
  });

  it("does not print a file name or extracted source to the console", async () => {
    const consoleSpies = [
      vi.spyOn(console, "debug"),
      vi.spyOn(console, "error"),
      vi.spyOn(console, "info"),
      vi.spyOn(console, "log"),
      vi.spyOn(console, "warn"),
    ];
    const source = "로그에 남으면 안 되는 학생 활동 원문";

    await extractDocumentText(new File([source], "student-name.txt", { type: "text/plain" }));

    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  });
});
