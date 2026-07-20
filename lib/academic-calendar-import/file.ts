import type { AcademicCell, AcademicSheet, AcademicWorkbook } from "@/lib/academic-calendar-import/types";

export const ACADEMIC_IMPORT_MAX_BYTES = 10 * 1024 * 1024;
export const ACADEMIC_IMPORT_ACCEPT = ".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv";

const allowedExtensions = new Set(["xlsx", "xls", "csv"]);
const allowedMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "application/octet-stream",
  "",
]);

export class AcademicImportFileError extends Error {
  constructor(readonly code: "unsupported" | "tooLarge" | "empty" | "unreadable" | "noSheets") {
    const messages = {
      unsupported: "엑셀 또는 CSV 파일만 선택해 주세요.",
      tooLarge: "파일 크기는 10MB 이하여야 합니다.",
      empty: "파일에 읽을 수 있는 내용이 없습니다.",
      unreadable: "파일을 읽지 못했습니다. 암호 설정이나 파일 손상 여부를 확인해 주세요.",
      noSheets: "가져올 수 있는 시트를 찾지 못했습니다.",
    } as const;
    super(messages[code]);
    this.name = "AcademicImportFileError";
  }
}

function fileExtension(name: string): string {
  return name.split(".").pop()?.toLocaleLowerCase("en-US") ?? "";
}

function likelyAcademicSheet(name: string, rows: readonly (readonly AcademicCell[])[]): boolean {
  const sample = `${name} ${rows.slice(0, 15).flat().join(" ")}`;
  return /(학사|일정|행사|날짜|월|일)/.test(sample);
}

export async function readAcademicWorkbook(file: File): Promise<AcademicWorkbook> {
  const extension = fileExtension(file.name);
  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.type)) throw new AcademicImportFileError("unsupported");
  if (file.size > ACADEMIC_IMPORT_MAX_BYTES) throw new AcademicImportFileError("tooLarge");
  if (file.size === 0) throw new AcademicImportFileError("empty");
  try {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const utf8 = new TextDecoder("utf-8").decode(buffer);
    const csvText = utf8.includes("\uFFFD") ? new TextDecoder("euc-kr").decode(buffer) : utf8;
    const workbook = extension === "csv"
      ? XLSX.read(csvText, { type: "string", cellDates: false, dense: true, raw: true, sheetRows: 5001 })
      : XLSX.read(buffer, { type: "array", cellDates: true, dense: true, sheetRows: 5001 });
    const sheets: AcademicSheet[] = workbook.SheetNames.flatMap((name) => {
      const sheet = workbook.Sheets[name];
      if (!sheet) return [];
      const rows = XLSX.utils.sheet_to_json<AcademicCell[]>(sheet, { header: 1, raw: true, defval: null })
        .map((row) => row.map((cell) => cell instanceof Date || typeof cell === "number" || typeof cell === "string" ? cell : null))
        .filter((row) => row.some((cell) => cell !== null && String(cell).trim() !== ""));
      return [{ name, rows, likely: likelyAcademicSheet(name, rows) }];
    });
    if (!sheets.length) throw new AcademicImportFileError("noSheets");
    return { fileName: file.name.split(/[\\/]/).pop() ?? "학사일정 파일", sheets };
  } catch (error) {
    if (error instanceof AcademicImportFileError) throw error;
    throw new AcademicImportFileError("unreadable");
  }
}
