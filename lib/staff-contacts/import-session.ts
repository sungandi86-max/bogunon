import { parseStaffContactFile, type StaffContactImportRow, type StaffContactImportValue, type StaffContactPdfDocumentType } from "@/lib/staff-contacts/import";
import type { StaffContactRecord } from "@/lib/staff-contacts/domain";

export type StaffContactImportFile = {
  readonly id: string;
  readonly file: File;
  readonly documentType: StaffContactPdfDocumentType;
};

export type StaffContactFileAnalysis = {
  readonly id: string;
  readonly fileName: string;
  readonly documentType: StaffContactPdfDocumentType;
  readonly rows: readonly StaffContactImportRow[];
  readonly error: string | null;
};

export type StaffContactImportSession = {
  readonly analyses: readonly StaffContactFileAnalysis[];
  readonly rows: readonly StaffContactImportRow[];
  readonly autoMerged: number;
};

const mergeFields = ["mobile_phone", "memo", "department", "grade_team", "subject", "role", "duties", "office_location", "seat", "extension"] as const satisfies readonly (keyof StaffContactImportValue)[];

function normalizedName(value: string): string {
  return value.replace(/[\s·.]/gu, "").toLocaleLowerCase("ko-KR");
}

function mergeRows(entries: readonly StaffContactImportRow[], existingById: ReadonlyMap<string, StaffContactRecord>): { readonly row: StaffContactImportRow; readonly merged: boolean } {
  const first = entries[0];
  if (!first) throw new Error("연락처 병합 대상이 없습니다.");
  const existing = first.existingContactId ? existingById.get(first.existingContactId) : undefined;
  const value: StaffContactImportValue = {
    ...first.value,
    mobile_phone: first.value.mobile_phone ?? existing?.mobile_phone ?? null,
    memo: first.value.memo ?? existing?.memo ?? null,
    department: first.value.department ?? existing?.department ?? null,
    grade_team: first.value.grade_team ?? existing?.grade_team ?? null,
    subject: first.value.subject ?? existing?.subject ?? null,
    role: first.value.role ?? existing?.role ?? null,
    duties: first.value.duties ?? existing?.duties ?? null,
    office_location: first.value.office_location ?? existing?.office_location ?? null,
    seat: first.value.seat ?? existing?.seat ?? null,
    extension: first.value.extension ?? existing?.extension ?? null,
  };
  const conflicts: string[] = [];
  for (const entry of entries) {
    for (const field of mergeFields) {
      const incoming = entry.value[field];
      if (!incoming) continue;
      const current = value[field];
      if (current && current !== incoming) {
        conflicts.push(`${field}: ${current} (${first.sourceName}) / ${incoming} (${entry.sourceName})`);
      } else if (!current) {
        value[field] = incoming;
      }
    }
  }
  const hasDuplicate = entries.some((entry) => entry.status === "needs_review");
  const status: StaffContactImportRow["status"] = conflicts.length > 0 || hasDuplicate ? "needs_review" : entries.some((entry) => entry.status === "changed") ? "changed" : first.status;
  const sourceNames = entries.map((entry) => entry.sourceName).filter(Boolean).join(", ");
  const message = conflicts.length > 0
    ? `파일 간 값이 충돌합니다. ${conflicts.join(" · ")}`
    : hasDuplicate
      ? "동명이인 또는 중복 후보가 있어 확인이 필요합니다."
      : entries.length > 1
        ? `${entries.length}개 파일에서 자동 병합했습니다.`
        : first.message;
  return {
    merged: entries.length > 1 && conflicts.length === 0 && !hasDuplicate,
    row: {
      ...first,
      sourceName: sourceNames,
      status,
      message,
      value,
      existingContactId: entries.find((entry) => entry.existingContactId)?.existingContactId ?? null,
      existingAssignmentId: entries.find((entry) => entry.existingAssignmentId)?.existingAssignmentId ?? null,
    },
  };
}

export async function analyzeStaffContactFiles(files: readonly StaffContactImportFile[], existing: readonly StaffContactRecord[]): Promise<StaffContactImportSession> {
  const analyses: StaffContactFileAnalysis[] = [];
  const grouped = new Map<string, StaffContactImportRow[]>();
  for (const item of files) {
    try {
      const rows = await parseStaffContactFile(item.file, existing, item.documentType);
      analyses.push({ id: item.id, fileName: item.file.name, documentType: item.documentType, rows, error: null });
      for (const row of rows) {
        if (!row.value.name || row.status === "error") continue;
        const key = normalizedName(row.value.name);
        grouped.set(key, [...(grouped.get(key) ?? []), { ...row, sourceName: item.file.name }]);
      }
    } catch (error) {
      analyses.push({ id: item.id, fileName: item.file.name, documentType: item.documentType, rows: [], error: error instanceof Error ? error.message : "파일을 분석하지 못했습니다." });
    }
  }
  const mergedRows: StaffContactImportRow[] = [];
  let autoMerged = 0;
  for (const entries of grouped.values()) {
    const result = mergeRows(entries, new Map(existing.map((contact) => [contact.id, contact])));
    mergedRows.push(result.row);
    if (result.merged) autoMerged += 1;
  }
  return { analyses, rows: mergedRows, autoMerged };
}
