"use client";

import { useState } from "react";
import { Trash2, Upload } from "lucide-react";

import type { StaffContactActionState } from "@/app/(app)/staff-contacts/actions";
import {
  analyzeStaffContactFiles,
  type StaffContactImportFile,
  type StaffContactImportSession,
} from "@/lib/staff-contacts/import-session";
import type {
  StaffContactImportRow,
  StaffContactPdfDocumentType,
} from "@/lib/staff-contacts/import";
import type { StaffContactRecord } from "@/lib/staff-contacts/domain";

const pdfTypes: readonly [StaffContactPdfDocumentType, string][] = [
  ["auto", "자동 감지"],
  ["seating", "좌석배치표"],
  ["assignment", "교무분장표"],
  ["directory", "연락처표"],
];

type Props = {
  readonly action: (payload: FormData) => void;
  readonly contacts: readonly StaffContactRecord[];
  readonly pending: boolean;
  readonly state: StaffContactActionState;
  readonly schoolYear: number;
  readonly semester: 1 | 2;
};

function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLocaleLowerCase("en-US").endsWith(".pdf")
  );
}

function statusLabel(status: StaffContactImportRow["status"]): string {
  return {
    new: "신규",
    changed: "변경",
    same: "동일",
    needs_review: "확인 필요",
    error: "오류",
  }[status];
}

function fileLabel(item: StaffContactImportFile): string {
  return `${item.file.name} · ${Math.max(1, Math.round(item.file.size / 1024))}KB`;
}

export function StaffContactImportPanel({
  action,
  contacts,
  pending,
  state,
  schoolYear,
  semester,
}: Props) {
  const [files, setFiles] = useState<StaffContactImportFile[]>([]);
  const [session, setSession] = useState<StaffContactImportSession | null>(
    null,
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState<string>();

  function addFiles(selected: FileList | null): void {
    if (!selected) return;
    const additions = Array.from(selected).map((file) => ({
      id: crypto.randomUUID(),
      file,
      documentType: "auto" as StaffContactPdfDocumentType,
    }));
    setFiles((current) => [...current, ...additions]);
    setSession(null);
    setMessage(undefined);
  }

  function updateDocumentType(
    id: string,
    documentType: StaffContactPdfDocumentType,
  ): void {
    setFiles((current) =>
      current.map((item) =>
        item.id === id ? { ...item, documentType } : item,
      ),
    );
    setSession(null);
  }

  function removeFile(id: string): void {
    setFiles((current) => current.filter((item) => item.id !== id));
    setSession(null);
  }

  async function analyze(): Promise<void> {
    if (files.length === 0 || analyzing) return;
    setAnalyzing(true);
    setMessage(undefined);
    try {
      const nextSession = await analyzeStaffContactFiles(files, contacts);
      setSession(nextSession);
      const hasLowYieldPdf = nextSession.analyses.some((analysis) => {
        const source = files.find((item) => item.id === analysis.id);
        return Boolean(
          source &&
          isPdf(source.file) &&
          !analysis.error &&
          analysis.rows.length > 0 &&
          analysis.rows.length < 10,
        );
      });
      if (hasLowYieldPdf)
        setMessage(
          "PDF 구조를 충분히 인식하지 못했습니다. 원본 문서 유형을 확인하거나 표 형태로 다시 저장해 주세요.",
        );
    } catch (error) {
      setSession(null);
      setMessage(
        error instanceof Error ? error.message : "파일을 분석하지 못했습니다.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const visibleRows =
    session?.rows.filter((row) => row.value.name || row.status !== "error") ??
    [];
  const importRows = visibleRows.filter(
    (row) => row.status === "new" || row.status === "changed",
  );
  const analyzedCount = visibleRows.filter(
    (row) => row.status !== "error",
  ).length;
  const needsReview = visibleRows.filter(
    (row) =>
      row.status === "needs_review" &&
      !row.message?.startsWith("기준 명단에 없는"),
  ).length;
  const failedFiles =
    session?.analyses.filter((analysis) => analysis.error) ?? [];

  const summary = session?.canonicalRosterCount ? (
    <>
      <strong>기준 교직원 {session.canonicalRosterCount}명</strong>
      <span>PDF 정보 매칭 {session.pdfMatchedCount}명</span>
      <span>자동 병합 {session.autoMerged}명</span>
      <span>기준 명단 외 후보 {session.outsideRosterCount}건</span>
      <span>확인 필요 {needsReview}명</span>
    </>
  ) : (
    <>
      <strong>선택한 파일 {files.length}개</strong>
      <strong>분석된 교직원 {analyzedCount}명</strong>
      <span>자동 병합 {session?.autoMerged ?? 0}명</span>
      <span>확인 필요 {needsReview}명</span>
    </>
  );

  return (
    <section className="staff-contacts-import">
      <div>
        <Upload aria-hidden="true" size={19} />
        <div>
          <h2>파일로 연락처 가져오기</h2>
          <p>
            좌석배치표·교무분장표·연락처 파일을 함께 올려 한 학기 자료로 미리
            확인합니다.
          </p>
        </div>
      </div>
      <div className="staff-contact-import-controls">
        <label className="button button--secondary">
          + 파일 추가
          <input
            accept=".xlsx,.xls,.csv,.pdf,application/pdf"
            hidden
            multiple
            onChange={(event) => {
              addFiles(event.target.files);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
        <button
          className="button button--primary"
          disabled={files.length === 0 || analyzing}
          onClick={() => void analyze()}
          type="button"
        >
          {analyzing ? "분석 중..." : "선택한 파일 분석"}
        </button>
      </div>
      {files.length > 0 && (
        <div className="staff-contact-import-files">
          <strong>선택한 파일 {files.length}개</strong>
          {files.map((item) => (
            <div className="staff-contact-import-file" key={item.id}>
              <span>✓ {fileLabel(item)}</span>
              {isPdf(item.file) ? (
                <label>
                  문서 유형
                  <select
                    aria-label={`${item.file.name} 문서 유형`}
                    onChange={(event) =>
                      updateDocumentType(
                        item.id,
                        event.target.value as StaffContactPdfDocumentType,
                      )
                    }
                    value={item.documentType}
                  >
                    {pdfTypes.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <small>표 형식</small>
              )}
              <button
                aria-label={`${item.file.name} 삭제`}
                onClick={() => removeFile(item.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      {message && (
        <p className="form-message" role="alert">
          {message}
        </p>
      )}
      {session && (
        <div className="staff-contacts-import__preview">
          <div className="staff-contacts-import__summary">
            {summary}
            <span>인식 실패 {failedFiles.length}건</span>
          </div>
          {session.analyses.map((analysis) => (
            <p
              className={
                analysis.error
                  ? "staff-contacts-import__file-result is-error"
                  : "staff-contacts-import__file-result"
              }
              key={analysis.id}
            >
              {analysis.error ? "⚠" : "✓"} {analysis.fileName} ·{" "}
              {analysis.error ?? `${analysis.rows.length}건`}
            </p>
          ))}
          {visibleRows.length > 0 && (
            <div className="staff-contacts-import__table">
              {visibleRows.map((row, index) => (
                <div
                  className="staff-contacts-import__row"
                  key={`${row.sourceName}-${index}`}
                >
                  <span
                    className={`staff-import-status staff-import-status--${row.status}`}
                  >
                    {statusLabel(row.status)}
                  </span>
                  <strong>{row.value.name}</strong>
                  <span>
                    {row.value.department ||
                      row.value.office_location ||
                      row.value.subject ||
                      "-"}
                  </span>
                  <small>{row.message ?? "새 연락처"}</small>
                </div>
              ))}
            </div>
          )}
          {importRows.length > 0 && (
            <form action={action}>
              <input name="schoolYear" type="hidden" value={schoolYear} />
              <input name="semester" type="hidden" value={semester} />
              <input
                name="rows"
                type="hidden"
                value={JSON.stringify(
                  importRows.map((row) => ({
                    existingContactId: row.existingContactId,
                    value: {
                      id: row.existingContactId ?? undefined,
                      name: row.value.name,
                      mobilePhone: row.value.mobile_phone,
                      memo: row.value.memo,
                      schoolYear,
                      semester,
                      department: row.value.department,
                      gradeTeam: row.value.grade_team,
                      subject: row.value.subject,
                      role: row.value.role,
                      duties: row.value.duties,
                      officeLocation: row.value.office_location,
                      seat: row.value.seat,
                      extension: row.value.extension,
                      isFavorite: row.value.is_favorite,
                      isActive: row.value.is_active,
                      sortOrder: row.value.sort_order,
                    },
                  })),
                )}
              />
              <button
                className="button button--primary"
                disabled={pending}
                type="submit"
              >
                {pending ? "가져오는 중..." : "검토한 연락처 가져오기"}
              </button>
            </form>
          )}
          {state.message && <p role="status">{state.message}</p>}
        </div>
      )}
    </section>
  );
}
