import type {
  AcademicCell,
  AcademicColumnMapping,
  AcademicDateOptions,
  AcademicImportItem,
} from "@/lib/academic-calendar-import/types";

const HEADER_WORDS = {
  date: ["날짜", "일자", "일시", "기간"],
  startDate: ["시작일", "시작 날짜"],
  endDate: ["종료일", "종료 날짜"],
  month: ["월"],
  day: ["일"],
  title: ["일정", "일정명", "행사", "행사명", "내용", "학사일정"],
} as const;

function text(cell: AcademicCell | undefined): string {
  if (cell instanceof Date) return cell.toISOString();
  return cell === null || cell === undefined ? "" : String(cell).trim();
}

function isoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inferredYear(month: number, options: AcademicDateOptions): number {
  return options.academicYearMode && month <= 2 ? options.academicYear + 1 : options.academicYear;
}

export function parseAcademicDate(value: AcademicCell, options: AcademicDateOptions, inheritedMonth?: number): string | null {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return isoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = Math.round((value - 25569) * 86400 * 1000);
    const date = new Date(milliseconds);
    return isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  const normalized = text(value)
    .replace(/\([^)]*[월화수목금토일][^)]*\)/g, "")
    .replace(/[년월]/g, "-")
    .replace(/일/g, "")
    .replace(/[./]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
  const numbers = normalized.split("-").filter(Boolean).map(Number);
  if (numbers.some((part) => !Number.isInteger(part))) return null;
  if (numbers.length === 3) return isoDate(numbers[0] ?? 0, numbers[1] ?? 0, numbers[2] ?? 0);
  if (numbers.length === 2) return isoDate(inferredYear(numbers[0] ?? 0, options), numbers[0] ?? 0, numbers[1] ?? 0);
  if (numbers.length === 1 && inheritedMonth) return isoDate(inferredYear(inheritedMonth, options), inheritedMonth, numbers[0] ?? 0);
  return null;
}

export function parseAcademicPeriod(value: AcademicCell, options: AcademicDateOptions): { readonly startDate: string; readonly endDate: string } | null {
  const source = text(value);
  const parts = source.split(/\s*(?:~|～|–|—|부터)\s*/).filter(Boolean);
  if (parts.length !== 2) {
    const date = parseAcademicDate(value, options);
    return date ? { startDate: date, endDate: date } : null;
  }
  const startDate = parseAcademicDate(parts[0] ?? "", options);
  if (!startDate) return null;
  const startMonth = Number(startDate.slice(5, 7));
  const endDate = parseAcademicDate(parts[1] ?? "", options, startMonth);
  return endDate && endDate >= startDate ? { startDate, endDate } : null;
}

function headerIndex(row: readonly AcademicCell[], words: readonly string[]): number | undefined {
  const index = row.findIndex((cell) => words.some((word) => text(cell).replace(/\s/g, "").includes(word.replace(/\s/g, ""))));
  return index >= 0 ? index : undefined;
}

export function detectAcademicColumns(rows: readonly (readonly AcademicCell[])[]): AcademicColumnMapping {
  let best: AcademicColumnMapping = { headerRow: 0 };
  let bestScore = -1;
  rows.slice(0, 20).forEach((row, headerRow) => {
    const dateColumn = headerIndex(row, HEADER_WORDS.date);
    const startDateColumn = headerIndex(row, HEADER_WORDS.startDate);
    const endDateColumn = headerIndex(row, HEADER_WORDS.endDate);
    const monthColumn = headerIndex(row, HEADER_WORDS.month);
    const dayColumn = headerIndex(row, HEADER_WORDS.day);
    const titleColumn = headerIndex(row, HEADER_WORDS.title);
    const candidate: AcademicColumnMapping = {
      headerRow,
      ...(dateColumn === undefined ? {} : { dateColumn }),
      ...(startDateColumn === undefined ? {} : { startDateColumn }),
      ...(endDateColumn === undefined ? {} : { endDateColumn }),
      ...(monthColumn === undefined ? {} : { monthColumn }),
      ...(dayColumn === undefined ? {} : { dayColumn }),
      ...(titleColumn === undefined ? {} : { titleColumn }),
    };
    const score = Object.values(candidate).filter((value) => value !== undefined).length - 1;
    if (score > bestScore) { best = candidate; bestScore = score; }
  });
  return bestScore >= 2 ? best : { headerRow: -1 };
}

function rowPeriod(row: readonly AcademicCell[], mapping: AcademicColumnMapping, options: AcademicDateOptions, monthContext?: number) {
  if (mapping.startDateColumn !== undefined) {
    const startDate = parseAcademicDate(row[mapping.startDateColumn] ?? null, options, monthContext);
    const endDate = mapping.endDateColumn === undefined ? startDate : parseAcademicDate(row[mapping.endDateColumn] ?? null, options, monthContext);
    return startDate && endDate && endDate >= startDate ? { startDate, endDate } : null;
  }
  if (mapping.monthColumn !== undefined && mapping.dayColumn !== undefined) {
    return parseAcademicPeriod(`${text(row[mapping.monthColumn])}/${text(row[mapping.dayColumn])}`, options);
  }
  if (mapping.dateColumn !== undefined) return parseAcademicPeriod(row[mapping.dateColumn] ?? null, options);
  return null;
}

export function parseAcademicRows(
  rows: readonly (readonly AcademicCell[])[],
  options: AcademicDateOptions,
  selectedMapping?: AcademicColumnMapping,
): { readonly mapping: AcademicColumnMapping; readonly items: readonly AcademicImportItem[] } {
  const mapping = selectedMapping ?? detectAcademicColumns(rows);
  let monthContext: number | undefined;
  const items: AcademicImportItem[] = [];
  rows.slice(mapping.headerRow + 1).forEach((row, offset) => {
    if (row.every((cell) => text(cell) === "")) return;
    const sourceRow = mapping.headerRow + offset + 2;
    const monthHeading = row.length <= 2 ? text(row[0]).match(/^(\d{1,2})월$/) : null;
    if (monthHeading) { monthContext = Number(monthHeading[1]); return; }
    const title = mapping.titleColumn === undefined ? text(row[1]) : text(row[mapping.titleColumn]);
    const rawDateCell = mapping.dateColumn === undefined ? row[0] : row[mapping.dateColumn];
    const inheritedDate = mapping.dateColumn === undefined ? parseAcademicDate(rawDateCell ?? null, options, monthContext) : null;
    const period = rowPeriod(row, mapping, options, monthContext)
      ?? (inheritedDate ? { startDate: inheritedDate, endDate: inheritedDate } : null);
    const status = !title ? "missingTitle" : !period ? "dateError" : "ready";
    items.push({
      id: `row-${sourceRow}`,
      sourceRow,
      rawDate: text(rawDateCell),
      title,
      startDate: period?.startDate ?? "",
      endDate: period?.endDate ?? "",
      status,
      selected: status === "ready",
    });
  });
  return { mapping, items };
}
