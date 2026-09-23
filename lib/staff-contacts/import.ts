import * as XLSX from "xlsx";

import type { StaffContactRecord } from "@/lib/staff-contacts/domain";

export type StaffContactImportStatus = "new" | "changed" | "same" | "needs_review" | "error";
export type StaffContactImportValue = { name: string; mobile_phone: string | null; memo: string | null; department: string | null; grade_team: string | null; subject: string | null; role: string | null; duties: string | null; office_location: string | null; seat: string | null; extension: string | null; is_favorite: boolean; sort_order: number; is_active: boolean };
export type StaffContactImportRow = { readonly sourceName: string; readonly status: StaffContactImportStatus; readonly message: string | null; readonly existingContactId: string | null; readonly existingAssignmentId: string | null; readonly value: StaffContactImportValue };

const aliases: Record<string, keyof StaffContactImportValue> = {
  "이름": "name", "성명": "name", "교직원명": "name", "부서": "department", "학년": "grade_team", "학년부": "grade_team", "교과": "subject", "보직": "role", "담당업무": "duties", "업무": "duties", "근무위치": "office_location", "위치": "office_location", "좌석": "seat", "내선": "extension", "내선번호": "extension", "휴대전화": "mobile_phone", "휴대폰": "mobile_phone", "전화번호": "mobile_phone", "메모": "memo",
};
function normalizeHeader(value: unknown): string { return String(value ?? "").replace(/[\s_/-]/g, "").trim(); }
function normalizedName(value: string): string { return value.replace(/[\s·.]/g, "").toLocaleLowerCase("ko-KR"); }
function asText(value: unknown): string { return String(value ?? "").trim(); }

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

export async function parseStaffContactFile(file: File, existing: readonly StaffContactRecord[]): Promise<StaffContactImportRow[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!firstSheet) throw new Error("읽을 수 있는 시트가 없습니다.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
  return parseStaffContactRows(rows, existing);
}
