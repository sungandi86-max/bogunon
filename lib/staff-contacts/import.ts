import * as XLSX from "xlsx";

import { extractDocumentText } from "@/lib/ai/document-text-extraction";
import type { StaffContactRecord } from "@/lib/staff-contacts/domain";

export type StaffContactImportStatus = "new" | "changed" | "same" | "needs_review" | "error";
export type StaffContactPdfDocumentType = "auto" | "seating" | "assignment" | "directory";
export type StaffContactImportValue = { name: string; mobile_phone: string | null; memo: string | null; department: string | null; grade_team: string | null; subject: string | null; role: string | null; duties: string | null; office_location: string | null; seat: string | null; extension: string | null; is_favorite: boolean; sort_order: number; is_active: boolean };
export type StaffContactImportRow = { readonly sourceName: string; readonly status: StaffContactImportStatus; readonly message: string | null; readonly existingContactId: string | null; readonly existingAssignmentId: string | null; readonly value: StaffContactImportValue };

const aliases: Record<string, keyof StaffContactImportValue> = {
  "이름": "name", "성명": "name", "교직원명": "name", "부서": "department", "학년": "grade_team", "학년부": "grade_team", "교과": "subject", "보직": "role", "담당업무": "duties", "업무": "duties", "근무위치": "office_location", "위치": "office_location", "좌석": "seat", "내선": "extension", "내선번호": "extension", "휴대전화": "mobile_phone", "휴대폰": "mobile_phone", "전화번호": "mobile_phone", "메모": "memo",
};
function normalizeHeader(value: unknown): string { return String(value ?? "").replace(/[\s_/-]/g, "").trim(); }
function normalizedName(value: string): string { return value.replace(/[\s·.]/g, "").toLocaleLowerCase("ko-KR"); }
function asText(value: unknown): string { return String(value ?? "").trim(); }

function pdfNameFromLine(line: string): string | null {
  const candidate = line.match(/(?:^|\s)([가-힣]{2,4})(?=\s|$|[0-9])/u)?.[1] ?? null;
  if (!candidate || ["교직원", "성명", "담당업무", "연락처", "좌석배치", "교무분장", "학교", "부서"].includes(candidate)) return null;
  return candidate;
}

function pdfField(line: string, patterns: readonly RegExp[]): string | null {
  for (const pattern of patterns) { const match = line.match(pattern)?.[1]; if (match) return match.trim(); }
  return null;
}

function parsePdfLine(line: string, documentType: StaffContactPdfDocumentType): Record<string, unknown> | null {
  const name = pdfNameFromLine(line);
  if (!name) return null;
  const mobilePhone = line.match(/01[016789][\s-]?\d{3,4}[\s-]?\d{4}/u)?.[0] ?? null;
  const extension = pdfField(line, [/(?:내선|전화|TEL|Ext\.?)[\s:]*(\d{3,4})/iu, /(?:^|\s)(\d{3,4})(?=\s|$)/u]);
  const location = pdfField(line, [/(?:위치|근무실|교무실)[\s:]*([^|,;]+)/u]);
  const department = pdfField(line, [/(?:부서|소속)[\s:]*([^|,;]+?)(?=\s+(?:학년|교과|보직|담당업무|업무|위치|근무실|좌석|내선|전화|휴대전화)\s*[:：]?|$)/u]);
  const duties = pdfField(line, [/(?:담당업무|업무|담당)[\s:]*([^|;]+?)(?=\s+(?:부서|소속|학년|교과|보직|위치|근무실|좌석|내선|전화|휴대전화)\s*[:：]?|$)/u]);
  const subject = pdfField(line, [/(?:교과|과목)[\s:]*([^|,;]+)/u]);
  const seat = pdfField(line, [/(?:좌석|자리)[\s:]*([^|,;]+)/u]);
  const hasSignal = Boolean(mobilePhone || extension || location || department || duties || subject || seat);
  if (!hasSignal) return null;
  if (documentType === "seating" && !(extension || location || seat || subject)) return null;
  if (documentType === "assignment" && !(department || duties || subject)) return null;
  if (documentType === "directory" && !mobilePhone && !extension) return null;
  return { 이름: name, 휴대전화: mobilePhone ?? "", 내선번호: extension ?? "", 위치: location ?? "", 부서: department ?? "", 담당업무: duties ?? "", 교과: subject ?? "", 좌석: seat ?? "" };
}

export function parseStaffContactPdfText(text: string, documentType: StaffContactPdfDocumentType, existing: readonly StaffContactRecord[]): StaffContactImportRow[] {
  const normalizedText = text.replace(/\s+/gu, " ").trim();
  const lines = normalizedText
    .replace(/(?<![:：])\s+(?=[가-힣]{2,4}\s+(?:부서|소속|교과|담당업무|업무|위치|근무실|좌석|내선|전화|휴대전화|01))/gu, "\n")
    .replace(/\s+(?=이름\s*[:：])/gu, "\n")
    .split(/\r?\n/u)
    .map((line) => line.replace(/\s+/gu, " ").trim())
    .filter(Boolean);
  const rows = lines.map((line) => parsePdfLine(line, documentType)).filter((row): row is Record<string, unknown> => row !== null);
  if (rows.length === 0) throw new Error("구조화된 연락처 행을 찾지 못했습니다. 좌석배치표·교무분장표·연락처표 PDF인지 확인하거나 XLSX/CSV를 사용해 주세요.");
  return parseStaffContactRows(rows.slice(0, 500), existing);
}

export function parseStaffContactRows(rows: readonly Record<string, unknown>[], existing: readonly StaffContactRecord[]): StaffContactImportRow[] {
  const existingByName = new Map<string, StaffContactRecord[]>();
  const importedNames = new Set<string>();
  existing.forEach((contact) => { const key = normalizedName(contact.name); existingByName.set(key, [...(existingByName.get(key) ?? []), contact]); });
  return rows.map((row) => {
    const mapped: Partial<Record<keyof StaffContactImportValue, string>> = {};
    Object.entries(row).forEach(([header, value]) => { const field = aliases[normalizeHeader(header)]; if (field) mapped[field] = asText(value); });
    const name = mapped.name ?? "";
    const nameKey = normalizedName(name);
    const matches = existingByName.get(normalizedName(name)) ?? [];
    const value: StaffContactImportValue = { name, mobile_phone: mapped.mobile_phone || null, memo: mapped.memo || null, department: mapped.department || null, grade_team: mapped.grade_team || null, subject: mapped.subject || null, role: mapped.role || null, duties: mapped.duties || null, office_location: mapped.office_location || null, seat: mapped.seat || null, extension: mapped.extension || null, is_favorite: false, sort_order: 0, is_active: true };
    if (!name) return { sourceName: name, status: "error", message: "이름 또는 장소명이 없습니다.", existingContactId: null, existingAssignmentId: null, value };
    if (importedNames.has(nameKey)) return { sourceName: name, status: "needs_review", message: "같은 파일에 같은 이름이 있어 확인이 필요합니다.", existingContactId: null, existingAssignmentId: null, value };
    importedNames.add(nameKey);
    if (matches.length > 1) return { sourceName: name, status: "needs_review", message: "동명이인 후보가 있어 확인이 필요합니다.", existingContactId: null, existingAssignmentId: null, value };
    const current = matches[0];
    if (!current) return { sourceName: name, status: "new", message: null, existingContactId: null, existingAssignmentId: null, value };
    const changed = ["department", "grade_team", "subject", "role", "duties", "office_location", "seat", "extension"].some((key) => String(current[key as keyof StaffContactRecord] ?? "") !== String(value[key as keyof StaffContactImportValue] ?? "")) || String(current.mobile_phone ?? "") !== String(value.mobile_phone ?? "");
    return { sourceName: name, status: changed ? "changed" : "same", message: changed ? "기존 학기 정보와 다른 항목이 있습니다." : "기존 학기 정보와 같습니다.", existingContactId: current.id, existingAssignmentId: current.assignment_id, value };
  });
}

export async function parseStaffContactFile(file: File, existing: readonly StaffContactRecord[], documentType: StaffContactPdfDocumentType = "auto"): Promise<StaffContactImportRow[]> {
  if (file.name.toLocaleLowerCase("en-US").endsWith(".pdf") || file.type === "application/pdf") {
    const extracted = await extractDocumentText(file, { allowedFormats: ["pdf"] });
    return parseStaffContactPdfText(extracted.text, documentType, existing);
  }
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!firstSheet) throw new Error("읽을 수 있는 시트가 없습니다.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
  return parseStaffContactRows(rows, existing);
}
