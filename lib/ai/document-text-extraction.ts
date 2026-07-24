export const DOCUMENT_FILE_FORMATS = ["txt", "docx", "pdf", "hwp", "hwpx"] as const;

export type DocumentFileFormat = (typeof DOCUMENT_FILE_FORMATS)[number];

export const DOCUMENT_UPLOAD_ACCEPT = [
  ".txt",
  ".docx",
  ".pdf",
  ".hwp",
  ".hwpx",
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/x-hwp",
  "application/haansofthwp",
  "application/haansofthwpx",
  "application/vnd.hancom.hwp",
  "application/vnd.hancom.hwpx",
].join(",");

export const DOCUMENT_FILE_LIMITS = {
  txt: 2 * 1024 * 1024,
  docx: 10 * 1024 * 1024,
  pdf: 15 * 1024 * 1024,
  hwp: 10 * 1024 * 1024,
  hwpx: 10 * 1024 * 1024,
} as const satisfies Readonly<Record<DocumentFileFormat, number>>;

const DOCUMENT_FILE_LABELS = {
  txt: "TXT",
  docx: "DOCX",
  pdf: "PDF",
  hwp: "HWP",
  hwpx: "HWPX",
} as const satisfies Readonly<Record<DocumentFileFormat, string>>;

const ALLOWED_MIME_TYPES = {
  txt: ["text/plain"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  pdf: ["application/pdf"],
  hwp: ["application/x-hwp", "application/haansofthwp", "application/vnd.hancom.hwp"],
  hwpx: ["application/haansofthwpx", "application/vnd.hancom.hwpx", "application/zip"],
} as const satisfies Readonly<Record<DocumentFileFormat, readonly string[]>>;

export type DocumentTextExtractionErrorCode =
  | "EMPTY_FILE"
  | "ENCRYPTED_FILE"
  | "FILE_TOO_LARGE"
  | "MIME_MISMATCH"
  | "NO_TEXT"
  | "READ_FAILED"
  | "UNSUPPORTED_TYPE";

export class DocumentTextExtractionError extends Error {
  constructor(
    readonly code: DocumentTextExtractionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DocumentTextExtractionError";
  }
}

export interface DocumentTextExtractionResult {
  readonly format: DocumentFileFormat;
  readonly text: string;
}

interface ExtractDocumentTextOptions {
  readonly allowedFormats?: readonly DocumentFileFormat[];
  readonly maxBytes?: number;
}

function normalizeText(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fileFormat(file: File): DocumentFileFormat {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("en-US");
  for (const format of DOCUMENT_FILE_FORMATS) {
    if (format === extension) return format;
  }
  throw new DocumentTextExtractionError(
    "UNSUPPORTED_TYPE",
    "TXT, DOCX, PDF, HWP, HWPX 파일만 불러올 수 있습니다.",
  );
}

function validateFile(file: File, options: ExtractDocumentTextOptions): DocumentFileFormat {
  const format = fileFormat(file);
  if (options.allowedFormats && !options.allowedFormats.includes(format)) {
    throw new DocumentTextExtractionError(
      "UNSUPPORTED_TYPE",
      `${options.allowedFormats.map((item) => DOCUMENT_FILE_LABELS[item]).join(", ")} 파일만 불러올 수 있습니다.`,
    );
  }

  const normalizedMime = file.type.toLocaleLowerCase("en-US");
  if (
    normalizedMime
    && normalizedMime !== "application/octet-stream"
    && !ALLOWED_MIME_TYPES[format].some((mime) => mime === normalizedMime)
  ) {
    throw new DocumentTextExtractionError(
      "MIME_MISMATCH",
      "파일 확장자와 형식이 일치하지 않습니다. 원본 파일을 다시 선택해 주세요.",
    );
  }

  const maxBytes = options.maxBytes ?? DOCUMENT_FILE_LIMITS[format];
  if (file.size > maxBytes) {
    const maxMegabytes = Math.round(maxBytes / (1024 * 1024));
    throw new DocumentTextExtractionError(
      "FILE_TOO_LARGE",
      `${DOCUMENT_FILE_LABELS[format]} 파일은 ${maxMegabytes}MB 이하만 불러올 수 있습니다.`,
    );
  }
  return format;
}

async function extractTxt(file: File): Promise<string> {
  return file.text();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

function normalizePdfLine(value: string): string {
  return value
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .replace(/\s+([)\]}])/g, "$1")
    .trim();
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
  });
  const document = await loadingTask.promise;
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = normalizePdfLine(
        content.items
          .flatMap((item) => ("str" in item && item.str.trim() ? [item.str.trim()] : []))
          .join(" "),
      );
      if (pageText) pages.push(pageText);
      page.cleanup();
    }
  } finally {
    await document.destroy();
  }
  return pages.join("\n\n");
}

async function extractHwpx(file: File): Promise<string> {
  const { HwpxReader } = await import("@ssabrojs/hwpxjs");
  const reader = new HwpxReader();
  await reader.loadFromArrayBuffer(await file.arrayBuffer());
  return reader.extractText();
}

async function extractHwp(file: File): Promise<string> {
  const { hwpToText } = await import("@ssabrojs/hwpxjs");
  return hwpToText(new Uint8Array(await file.arrayBuffer()), {
    paragraphSeparator: "\n",
    sectionSeparator: "\n\n",
  });
}

async function extractByFormat(file: File, format: DocumentFileFormat): Promise<string> {
  switch (format) {
    case "txt":
      return extractTxt(file);
    case "docx":
      return extractDocx(file);
    case "pdf":
      return extractPdf(file);
    case "hwp":
      return extractHwp(file);
    case "hwpx":
      return extractHwpx(file);
  }
}

function extractionError(error: unknown, format: DocumentFileFormat): DocumentTextExtractionError {
  if (error instanceof DocumentTextExtractionError) return error;
  if (error instanceof Error && /encrypt|password|암호/i.test(error.name + error.message)) {
    return new DocumentTextExtractionError(
      "ENCRYPTED_FILE",
      "암호화되거나 배포용으로 보호된 문서는 불러올 수 없습니다.",
    );
  }
  if (format === "pdf") {
    return new DocumentTextExtractionError(
      "READ_FAILED",
      "PDF를 읽지 못했습니다. 손상되었거나 암호화된 파일인지 확인해 주세요.",
    );
  }
  if (format === "hwp") {
    return new DocumentTextExtractionError(
      "READ_FAILED",
      "HWP 본문을 읽지 못했습니다. HWP 5.0 문서인지 확인해 주세요.",
    );
  }
  return new DocumentTextExtractionError(
    "READ_FAILED",
    "파일을 읽지 못했습니다. 손상되었거나 지원하지 않는 문서인지 확인해 주세요.",
  );
}

export async function extractDocumentText(
  file: File,
  options: ExtractDocumentTextOptions = {},
): Promise<DocumentTextExtractionResult> {
  const format = validateFile(file, options);
  let text: string;
  try {
    text = normalizeText(await extractByFormat(file, format));
  } catch (error) {
    throw extractionError(error, format);
  }

  if (!text) {
    const isPdf = format === "pdf";
    throw new DocumentTextExtractionError(
      isPdf ? "NO_TEXT" : "EMPTY_FILE",
      isPdf
        ? "이 PDF에서는 텍스트를 찾지 못했습니다. 스캔한 문서라면 내용을 직접 붙여넣어 주세요."
        : "파일에서 입력할 내용을 찾지 못했습니다.",
    );
  }
  return { format, text };
}
