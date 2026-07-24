export type DocumentTextExtractionErrorCode =
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_TYPE"
  | "READ_FAILED";

export class DocumentTextExtractionError extends Error {
  constructor(
    readonly code: DocumentTextExtractionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DocumentTextExtractionError";
  }
}

interface ExtractTextFileOptions {
  readonly maxBytes?: number;
}

const DEFAULT_MAX_BYTES = 1024 * 1024;

function isSupportedTextFile(file: File): boolean {
  return file.name.toLocaleLowerCase("en-US").endsWith(".txt")
    && (!file.type || file.type === "text/plain");
}

export async function extractTextFile(
  file: File,
  options: ExtractTextFileOptions = {},
): Promise<string> {
  if (!isSupportedTextFile(file)) {
    throw new DocumentTextExtractionError(
      "UNSUPPORTED_TYPE",
      "현재는 TXT 파일만 불러올 수 있습니다.",
    );
  }
  if (file.size > (options.maxBytes ?? DEFAULT_MAX_BYTES)) {
    throw new DocumentTextExtractionError(
      "FILE_TOO_LARGE",
      "파일이 너무 큽니다. 1MB 이하의 TXT 파일을 사용해 주세요.",
    );
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new DocumentTextExtractionError(
      "READ_FAILED",
      "파일을 읽지 못했습니다. 파일을 확인하고 다시 시도해 주세요.",
    );
  }

  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    throw new DocumentTextExtractionError(
      "EMPTY_FILE",
      "파일에서 입력할 내용을 찾지 못했습니다.",
    );
  }
  return normalized;
}
