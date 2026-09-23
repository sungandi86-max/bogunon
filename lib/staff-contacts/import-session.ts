import {
  parseStaffContactFile,
  type StaffContactImportRow,
  type StaffContactImportValue,
  type StaffContactPdfDocumentType,
} from "@/lib/staff-contacts/import";
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
  readonly canonicalRosterCount: number;
  readonly pdfMatchedCount: number;
  readonly outsideRosterCount: number;
};

const mergeFields = [
  "mobile_phone",
  "memo",
  "department",
  "grade_team",
  "subject",
  "role",
  "duties",
  "office_location",
  "seat",
  "extension",
] as const satisfies readonly (keyof StaffContactImportValue)[];

function normalizedName(value: string): string {
  return value.replace(/[\s·.]/gu, "").toLocaleLowerCase("ko-KR");
}

function isSpreadsheet(file: File): boolean {
  return /\.(?:xlsx?|csv)$/iu.test(file.name);
}

function asOutsideRosterCandidate(
  row: StaffContactImportRow,
): StaffContactImportRow {
  return {
    ...row,
    status: "needs_review",
    message:
      "기준 명단에 없는 이름 후보입니다. 교직원으로 추가할지 확인해 주세요.",
    existingContactId: null,
    existingAssignmentId: null,
  };
}

function hasRosterNameInDuties(
  row: StaffContactImportRow,
  rosterNames: ReadonlySet<string>,
): boolean {
  const duties = normalizedName(row.value.duties ?? "");
  const ownName = normalizedName(row.value.name);
  return [...rosterNames].some(
    (name) => name !== ownName && name.length >= 3 && duties.includes(name),
  );
}

function markParserReview(
  row: StaffContactImportRow,
  message: string,
): StaffContactImportRow {
  return {
    ...row,
    status: "needs_review",
    message,
    existingContactId: row.existingContactId,
    existingAssignmentId: row.existingAssignmentId,
  };
}

function mergeRows(
  entries: readonly StaffContactImportRow[],
  existingById: ReadonlyMap<string, StaffContactRecord>,
): { readonly row: StaffContactImportRow; readonly merged: boolean } {
  const first = entries[0];
  if (!first) throw new Error("연락처 병합 대상이 없습니다.");
  const existing = first.existingContactId
    ? existingById.get(first.existingContactId)
    : undefined;
  const value: StaffContactImportValue = {
    ...first.value,
    mobile_phone: first.value.mobile_phone ?? existing?.mobile_phone ?? null,
    memo: first.value.memo ?? existing?.memo ?? null,
    department: first.value.department ?? existing?.department ?? null,
    grade_team: first.value.grade_team ?? existing?.grade_team ?? null,
    subject: first.value.subject ?? existing?.subject ?? null,
    role: first.value.role ?? existing?.role ?? null,
    duties: first.value.duties ?? existing?.duties ?? null,
    office_location:
      first.value.office_location ?? existing?.office_location ?? null,
    seat: first.value.seat ?? existing?.seat ?? null,
    extension: first.value.extension ?? existing?.extension ?? null,
  };
  const conflicts: string[] = [];
  const existingChanges = existing
    ? mergeFields
        .map((field) => {
          const before = String(
            existing[field as keyof StaffContactRecord] ?? "",
          );
          const after = String(first.value[field] ?? "");
          return before && after && before !== after
            ? `${field}: ${before} → ${after}`
            : null;
        })
        .filter((change): change is string => Boolean(change))
    : [];
  for (const entry of entries) {
    for (const field of mergeFields) {
      const incoming = entry.value[field];
      if (!incoming) continue;
      const current = value[field];
      if (current && current !== incoming) {
        conflicts.push(
          `${field}: ${current} (${first.sourceName}) / ${incoming} (${entry.sourceName})`,
        );
      } else if (!current) {
        value[field] = incoming;
      }
    }
  }
  const hasDuplicate = entries.some((entry) => entry.status === "needs_review");
  const reviewMessage = entries.find(
    (entry) => entry.status === "needs_review" && entry.message,
  )?.message;
  const status: StaffContactImportRow["status"] =
    conflicts.length > 0 || hasDuplicate
      ? "needs_review"
      : entries.some((entry) => entry.status === "changed")
        ? "changed"
        : first.status;
  const sourceNames = entries
    .map((entry) => entry.sourceName)
    .filter(Boolean)
    .join(", ");
  const message =
    conflicts.length > 0
      ? `파일 간 값이 충돌합니다. ${conflicts.join(" · ")}`
      : reviewMessage
        ? reviewMessage
        : hasDuplicate
          ? "동명이인 또는 중복 후보가 있어 확인이 필요합니다."
          : existingChanges.length > 0
            ? `기존 값 → 새 값: ${existingChanges.join(" · ")}`
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
      existingContactId:
        entries.find((entry) => entry.existingContactId)?.existingContactId ??
        null,
      existingAssignmentId:
        entries.find((entry) => entry.existingAssignmentId)
          ?.existingAssignmentId ?? null,
    },
  };
}

export async function analyzeStaffContactFiles(
  files: readonly StaffContactImportFile[],
  existing: readonly StaffContactRecord[],
): Promise<StaffContactImportSession> {
  const analyses: StaffContactFileAnalysis[] = [];
  for (const item of files) {
    try {
      const rows = await parseStaffContactFile(
        item.file,
        existing,
        item.documentType,
      );
      analyses.push({
        id: item.id,
        fileName: item.file.name,
        documentType: item.documentType,
        rows,
        error: null,
      });
    } catch (error) {
      analyses.push({
        id: item.id,
        fileName: item.file.name,
        documentType: item.documentType,
        rows: [],
        error:
          error instanceof Error
            ? error.message
            : "파일을 분석하지 못했습니다.",
      });
    }
  }
  const canonicalNames = new Set<string>();
  for (const analysis of analyses) {
    const source = files.find((item) => item.id === analysis.id);
    if (!source || !isSpreadsheet(source.file) || analysis.error) continue;
    for (const row of analysis.rows) {
      if (row.value.name && row.status !== "error")
        canonicalNames.add(normalizedName(row.value.name));
    }
  }
  const hasCanonicalRoster = canonicalNames.size > 0;
  const grouped = new Map<string, StaffContactImportRow[]>();
  const outsideCandidates = new Map<string, StaffContactImportRow>();
  const pdfRows: StaffContactImportRow[] = [];
  let pdfMatchedCount = 0;
  for (const analysis of analyses) {
    const source = files.find((item) => item.id === analysis.id);
    if (!source || analysis.error) continue;
    const pdf = !isSpreadsheet(source.file);
    for (const row of analysis.rows) {
      if (!row.value.name || row.status === "error") continue;
      const key = normalizedName(row.value.name);
      if (hasCanonicalRoster && pdf && !canonicalNames.has(key)) {
        outsideCandidates.set(
          key,
          asOutsideRosterCandidate({ ...row, sourceName: analysis.fileName }),
        );
        continue;
      }
      const sourcedRow = { ...row, sourceName: analysis.fileName };
      if (hasCanonicalRoster && pdf) {
        pdfMatchedCount += 1;
        pdfRows.push(sourcedRow);
      } else {
        grouped.set(key, [...(grouped.get(key) ?? []), sourcedRow]);
      }
    }
  }
  const dutiesFrequency = new Map<string, number>();
  for (const row of pdfRows) {
    const duties = normalizedName(row.value.duties ?? "");
    if (duties)
      dutiesFrequency.set(duties, (dutiesFrequency.get(duties) ?? 0) + 1);
  }
  for (const row of pdfRows) {
    const key = normalizedName(row.value.name);
    const duties = normalizedName(row.value.duties ?? "");
    const contaminated = hasRosterNameInDuties(row, canonicalNames);
    const repeated = Boolean(duties && (dutiesFrequency.get(duties) ?? 0) > 3);
    const safeRow = contaminated
      ? markParserReview(
          row,
          "담당업무에 다른 교직원 이름이 포함되어 확인이 필요합니다.",
        )
      : repeated
        ? markParserReview(
            row,
            "같은 담당업무가 여러 교직원에게 반복되어 PDF 셀 경계를 확인해 주세요.",
          )
        : row;
    grouped.set(key, [...(grouped.get(key) ?? []), safeRow]);
  }
  const mergedRows: StaffContactImportRow[] = [];
  let autoMerged = 0;
  for (const entries of grouped.values()) {
    const result = mergeRows(
      entries,
      new Map(existing.map((contact) => [contact.id, contact])),
    );
    mergedRows.push(result.row);
    if (result.merged) autoMerged += 1;
  }
  mergedRows.push(...outsideCandidates.values());
  return {
    analyses,
    rows: mergedRows,
    autoMerged,
    canonicalRosterCount: canonicalNames.size,
    pdfMatchedCount,
    outsideRosterCount: outsideCandidates.size,
  };
}
