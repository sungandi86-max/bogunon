import * as XLSX from "xlsx";

import {
  extractPdfLayout,
  type DocumentPdfTextItem,
} from "@/lib/ai/document-text-extraction";
import type { StaffContactRecord } from "@/lib/staff-contacts/domain";

export type StaffContactImportStatus =
  "new" | "changed" | "same" | "needs_review" | "error";
export type StaffContactPdfDocumentType =
  "auto" | "seating" | "assignment" | "directory";
export type StaffContactImportValue = {
  name: string;
  mobile_phone: string | null;
  memo: string | null;
  department: string | null;
  grade_team: string | null;
  subject: string | null;
  role: string | null;
  duties: string | null;
  office_location: string | null;
  seat: string | null;
  extension: string | null;
  is_favorite: boolean;
  sort_order: number;
  is_active: boolean;
};
export type StaffContactImportRow = {
  readonly sourceName: string;
  readonly status: StaffContactImportStatus;
  readonly message: string | null;
  readonly existingContactId: string | null;
  readonly existingAssignmentId: string | null;
  readonly value: StaffContactImportValue;
};

const aliases: Record<string, keyof StaffContactImportValue> = {
  이름: "name",
  성명: "name",
  교직원명: "name",
  부서: "department",
  학년: "grade_team",
  학년부: "grade_team",
  교과: "subject",
  보직: "role",
  담당업무: "duties",
  업무: "duties",
  근무위치: "office_location",
  위치: "office_location",
  좌석: "seat",
  내선: "extension",
  내선번호: "extension",
  휴대전화: "mobile_phone",
  휴대폰: "mobile_phone",
  전화번호: "mobile_phone",
  메모: "memo",
};
function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .replace(/[\s_/-]/g, "")
    .trim();
}
function normalizedName(value: string): string {
  return value.replace(/[\s·.]/g, "").toLocaleLowerCase("ko-KR");
}
function asText(value: unknown): string {
  return String(value ?? "").trim();
}

type PdfLine = {
  readonly page: number;
  readonly y: number;
  readonly items: readonly DocumentPdfTextItem[];
  readonly text: string;
};
const excludedPdfNames = new Set([
  "교직원",
  "성명",
  "담당업무",
  "연락처",
  "좌석배치",
  "교무분장",
  "학교",
  "부서",
  "교과",
  "내선",
  "행정실",
  "생활안전부",
]);
const locationWords =
  /(?:교무실|보건실|상담실|도서관|방송실|시청각실|행정실|교장실|교감실|학년부)/u;

function pdfLines(items: readonly DocumentPdfTextItem[]): PdfLine[] {
  const lines: PdfLine[] = [];
  const sorted = [...items].sort(
    (left, right) =>
      left.page - right.page || right.y - left.y || left.x - right.x,
  );
  for (const item of sorted) {
    const previous = lines.at(-1);
    if (
      !previous ||
      previous.page !== item.page ||
      Math.abs(previous.y - item.y) > Math.max(3, item.height * 0.65)
    ) {
      lines.push({
        page: item.page,
        y: item.y,
        items: [item],
        text: item.text,
      });
    } else {
      const nextItems = [...previous.items, item].sort(
        (left, right) => left.x - right.x,
      );
      lines[lines.length - 1] = {
        ...previous,
        items: nextItems,
        text: nextItems.map((entry) => entry.text).join(" "),
      };
    }
  }
  return lines;
}

function pdfNameFromText(text: string): string | null {
  for (const match of text.matchAll(/(?:^|\s)([가-힣]{2,4})(?=\s|$|[0-9])/gu)) {
    const candidate = match[1];
    if (
      candidate &&
      !excludedPdfNames.has(candidate) &&
      !locationWords.test(candidate)
    )
      return candidate;
  }
  return null;
}

function extensionFromText(text: string): string | null {
  return (
    text.match(/(?:내선|전화|TEL|Ext\.?\s*)?\s(\d{3,4})(?=\s|$)/iu)?.[1] ??
    text.match(/(?:내선|전화|TEL|Ext\.?)\s*[:：]?\s*(\d{3,4})/iu)?.[1] ??
    null
  );
}

const subjectPattern =
  /(?:보건|국어|수학|영어|체육|과학|사회|음악|미술|상담|특수|가정|기술|정보|컴퓨터|사서)/u;

function nonNameTokens(line: PdfLine, name: string): string[] {
  return line.items
    .map((item) => item.text)
    .filter((text) => text !== name && !/^\d{3,4}$/u.test(text));
}

function nameItems(line: PdfLine): readonly DocumentPdfTextItem[] {
  const candidates = line.items.filter(
    (item) => pdfNameFromText(item.text) !== null,
  );
  const first = candidates[0];
  if (!first) return [];
  return candidates.filter((item) => item.x <= first.x + 24);
}

function assignmentDepartment(line: PdfLine, nameX: number): string | null {
  const item = line.items[0];
  if (line.items.length !== 1 || !item || item.x > nameX + 24) return null;
  const candidate = line.text.trim();
  if (
    !candidate ||
    candidate.length > 30 ||
    /\d|[·,/:]/u.test(candidate) ||
    /교무분장|담당업무|성명|교과|이름/u.test(candidate)
  )
    return null;
  if (!/(?:부|실|과|팀|센터)$/u.test(candidate)) return null;
  return candidate;
}

function parseAssignmentLayout(
  items: readonly DocumentPdfTextItem[],
): Record<string, unknown>[] {
  const lines = pdfLines(items);
  let department: {
    readonly page: number;
    readonly x: number;
    readonly value: string;
  } | null = null;
  const rows: Record<string, unknown>[] = [];
  for (const line of lines) {
    const firstItem = line.items[0];
    if (!firstItem) continue;
    const lineNames = nameItems(line);
    if (lineNames.length === 0) {
      const header = assignmentDepartment(line, firstItem.x);
      if (header)
        department = { page: line.page, x: firstItem.x, value: header };
      continue;
    }
    for (let nameIndex = 0; nameIndex < lineNames.length; nameIndex += 1) {
      const nameItem = lineNames[nameIndex];
      if (!nameItem) continue;
      const nextNameX = lineNames[nameIndex + 1]?.x ?? Number.POSITIVE_INFINITY;
      const segment = line.items.filter(
        (item) => item.x >= nameItem.x && item.x < nextNameX,
      );
      const name = pdfNameFromText(nameItem.text);
      if (!name) continue;
      const tokens = segment
        .map((item) => item.text)
        .filter((text) => text !== name && !/^\d{3,4}$/u.test(text));
      const subject =
        tokens.find((token) => subjectPattern.test(token)) ?? tokens[0] ?? null;
      const duties =
        tokens.filter((token) => token !== subject).join(" · ") || null;
      const scopedDepartment =
        department &&
        department.page === line.page &&
        Math.abs(department.x - nameItem.x) < 180
          ? department.value
          : "";
      rows.push({
        이름: name,
        부서: scopedDepartment,
        교과: subject ?? "",
        담당업무: duties ?? "",
      });
    }
  }
  return rows;
}

function parseSeatingLayout(
  items: readonly DocumentPdfTextItem[],
): Record<string, unknown>[] {
  const lines = pdfLines(items);
  let location = "";
  const rows: Record<string, unknown>[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    if (locationWords.test(line.text) && !pdfNameFromText(line.text))
      location = line.text;
    const name = pdfNameFromText(line.text);
    if (!name) continue;
    const nearby = lines
      .slice(index, index + 3)
      .filter((candidate) => !pdfNameFromText(candidate.text));
    const combined = [
      line.text,
      ...nearby.map((candidate) => candidate.text),
    ].join(" ");
    const extension = extensionFromText(combined);
    const subject =
      nonNameTokens(line, name).find((token) => !/^\d{3,4}$/u.test(token)) ??
      "";
    rows.push({
      이름: name,
      교과: subject,
      위치: location,
      내선번호: extension ?? "",
    });
  }
  return rows;
}

function parseDirectoryLayout(
  items: readonly DocumentPdfTextItem[],
): Record<string, unknown>[] {
  return pdfLines(items).flatMap((line) => {
    const name = pdfNameFromText(line.text);
    const mobile =
      line.text.match(/01[016789][\s-]?\d{3,4}[\s-]?\d{4}/u)?.[0] ?? null;
    return name && mobile ? [{ 이름: name, 휴대전화: mobile }] : [];
  });
}

function detectPdfDocumentType(
  items: readonly DocumentPdfTextItem[],
): Exclude<StaffContactPdfDocumentType, "auto"> {
  const heading = items.map((item) => item.text).join(" ");
  if (/좌석\s*배치|자리\s*배치|교무실/u.test(heading)) return "seating";
  if (/연락처|휴대전화|휴대폰|전화번호/u.test(heading)) return "directory";
  return "assignment";
}

export function parseStaffContactPdfLayout(
  items: readonly DocumentPdfTextItem[],
  documentType: StaffContactPdfDocumentType,
  existing: readonly StaffContactRecord[],
): StaffContactImportRow[] {
  const resolvedType =
    documentType === "auto" ? detectPdfDocumentType(items) : documentType;
  const rows =
    resolvedType === "seating"
      ? parseSeatingLayout(items)
      : resolvedType === "directory"
        ? parseDirectoryLayout(items)
        : parseAssignmentLayout(items);
  if (rows.length === 0)
    throw new Error(
      "PDF 구조를 충분히 인식하지 못했습니다. 좌석배치표·교무분장표·연락처표인지 확인해 주세요.",
    );
  return parseStaffContactRows(rows.slice(0, 1000), existing);
}

function pdfNameFromLine(line: string): string | null {
  const candidate =
    line.match(/(?:^|\s)([가-힣]{2,4})(?=\s|$|[0-9])/u)?.[1] ?? null;
  if (
    !candidate ||
    [
      "교직원",
      "성명",
      "담당업무",
      "연락처",
      "좌석배치",
      "교무분장",
      "학교",
      "부서",
    ].includes(candidate)
  )
    return null;
  return candidate;
}

function pdfField(line: string, patterns: readonly RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = line.match(pattern)?.[1];
    if (match) return match.trim();
  }
  return null;
}

function parsePdfLine(
  line: string,
  documentType: StaffContactPdfDocumentType,
): Record<string, unknown> | null {
  const name = pdfNameFromLine(line);
  if (!name) return null;
  const mobilePhone =
    line.match(/01[016789][\s-]?\d{3,4}[\s-]?\d{4}/u)?.[0] ?? null;
  const extension = pdfField(line, [
    /(?:내선|전화|TEL|Ext\.?)[\s:]*(\d{3,4})/iu,
    /(?:^|\s)(\d{3,4})(?=\s|$)/u,
  ]);
  const location = pdfField(line, [/(?:위치|근무실|교무실)[\s:]*([^|,;]+)/u]);
  const department = pdfField(line, [
    /(?:부서|소속)[\s:]*([^|,;]+?)(?=\s+(?:학년|교과|보직|담당업무|업무|위치|근무실|좌석|내선|전화|휴대전화)\s*[:：]?|$)/u,
  ]);
  const duties = pdfField(line, [
    /(?:담당업무|업무|담당)[\s:]*([^|;]+?)(?=\s+(?:부서|소속|학년|교과|보직|위치|근무실|좌석|내선|전화|휴대전화)\s*[:：]?|$)/u,
  ]);
  const subject = pdfField(line, [/(?:교과|과목)[\s:]*([^|,;]+)/u]);
  const seat = pdfField(line, [/(?:좌석|자리)[\s:]*([^|,;]+)/u]);
  const hasSignal = Boolean(
    mobilePhone ||
    extension ||
    location ||
    department ||
    duties ||
    subject ||
    seat,
  );
  if (!hasSignal) return null;
  if (documentType === "seating" && !(extension || location || seat || subject))
    return null;
  if (documentType === "assignment" && !(department || duties || subject))
    return null;
  if (documentType === "directory" && !mobilePhone && !extension) return null;
  return {
    이름: name,
    휴대전화: mobilePhone ?? "",
    내선번호: extension ?? "",
    위치: location ?? "",
    부서: department ?? "",
    담당업무: duties ?? "",
    교과: subject ?? "",
    좌석: seat ?? "",
  };
}

export function parseStaffContactPdfText(
  text: string,
  documentType: StaffContactPdfDocumentType,
  existing: readonly StaffContactRecord[],
): StaffContactImportRow[] {
  const normalizedText = text.replace(/\s+/gu, " ").trim();
  const lines = normalizedText
    .replace(
      /(?<![:：])\s+(?=[가-힣]{2,4}\s+(?:부서|소속|교과|담당업무|업무|위치|근무실|좌석|내선|전화|휴대전화|01))/gu,
      "\n",
    )
    .replace(/\s+(?=이름\s*[:：])/gu, "\n")
    .split(/\r?\n/u)
    .map((line) => line.replace(/\s+/gu, " ").trim())
    .filter(Boolean);
  const rows = lines
    .map((line) => parsePdfLine(line, documentType))
    .filter((row): row is Record<string, unknown> => row !== null);
  if (rows.length === 0)
    throw new Error(
      "구조화된 연락처 행을 찾지 못했습니다. 좌석배치표·교무분장표·연락처표 PDF인지 확인하거나 XLSX/CSV를 사용해 주세요.",
    );
  return parseStaffContactRows(rows.slice(0, 500), existing);
}

export function parseStaffContactRows(
  rows: readonly Record<string, unknown>[],
  existing: readonly StaffContactRecord[],
): StaffContactImportRow[] {
  const existingByName = new Map<string, StaffContactRecord[]>();
  const importedNames = new Set<string>();
  existing.forEach((contact) => {
    const key = normalizedName(contact.name);
    existingByName.set(key, [...(existingByName.get(key) ?? []), contact]);
  });
  return rows.map((row) => {
    const mapped: Partial<Record<keyof StaffContactImportValue, string>> = {};
    Object.entries(row).forEach(([header, value]) => {
      const field = aliases[normalizeHeader(header)];
      if (field) mapped[field] = asText(value);
    });
    const name = mapped.name ?? "";
    const nameKey = normalizedName(name);
    const matches = existingByName.get(normalizedName(name)) ?? [];
    const value: StaffContactImportValue = {
      name,
      mobile_phone: mapped.mobile_phone || null,
      memo: mapped.memo || null,
      department: mapped.department || null,
      grade_team: mapped.grade_team || null,
      subject: mapped.subject || null,
      role: mapped.role || null,
      duties: mapped.duties || null,
      office_location: mapped.office_location || null,
      seat: mapped.seat || null,
      extension: mapped.extension || null,
      is_favorite: false,
      sort_order: 0,
      is_active: true,
    };
    if (!name)
      return {
        sourceName: name,
        status: "error",
        message: "이름 또는 장소명이 없습니다.",
        existingContactId: null,
        existingAssignmentId: null,
        value,
      };
    if (importedNames.has(nameKey))
      return {
        sourceName: name,
        status: "needs_review",
        message: "같은 파일에 같은 이름이 있어 확인이 필요합니다.",
        existingContactId: null,
        existingAssignmentId: null,
        value,
      };
    importedNames.add(nameKey);
    if (matches.length > 1)
      return {
        sourceName: name,
        status: "needs_review",
        message: "동명이인 후보가 있어 확인이 필요합니다.",
        existingContactId: null,
        existingAssignmentId: null,
        value,
      };
    const current = matches[0];
    if (!current)
      return {
        sourceName: name,
        status: "new",
        message: null,
        existingContactId: null,
        existingAssignmentId: null,
        value,
      };
    const changed =
      [
        "department",
        "grade_team",
        "subject",
        "role",
        "duties",
        "office_location",
        "seat",
        "extension",
      ].some(
        (key) =>
          String(current[key as keyof StaffContactRecord] ?? "") !==
          String(value[key as keyof StaffContactImportValue] ?? ""),
      ) ||
      String(current.mobile_phone ?? "") !== String(value.mobile_phone ?? "");
    return {
      sourceName: name,
      status: changed ? "changed" : "same",
      message: changed
        ? "기존 학기 정보와 다른 항목이 있습니다."
        : "기존 학기 정보와 같습니다.",
      existingContactId: current.id,
      existingAssignmentId: current.assignment_id,
      value,
    };
  });
}

export async function parseStaffContactFile(
  file: File,
  existing: readonly StaffContactRecord[],
  documentType: StaffContactPdfDocumentType = "auto",
): Promise<StaffContactImportRow[]> {
  if (
    file.name.toLocaleLowerCase("en-US").endsWith(".pdf") ||
    file.type === "application/pdf"
  ) {
    const layout = await extractPdfLayout(file);
    return parseStaffContactPdfLayout(
      layout,
      documentType === "auto" ? "assignment" : documentType,
      existing,
    );
  }
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!firstSheet) throw new Error("읽을 수 있는 시트가 없습니다.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  });
  return parseStaffContactRows(rows, existing);
}
