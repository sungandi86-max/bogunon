"use client";

import { useActionState, useEffect, useState } from "react";
import { importMedicationItemsAction, type MedicationActionState } from "@/app/(app)/medications/actions";
import { buildMedicationImportPreview, medicationImportStatusLabels, type MedicationImportPreview, type MedicationImportRawRow } from "@/lib/medications/import-parser";
import { medicationCategoryLabels, type MedicationItem, type MedicationLot } from "@/lib/medications/domain";

const idle: MedicationActionState = { status: "idle" };

type Props = { readonly items: readonly MedicationItem[]; readonly lots: readonly MedicationLot[]; readonly today: string; readonly onClose: () => void };

function Message({ state }: { readonly state: MedicationActionState }) {
  return state.message ? <p className={state.status === "error" ? "form-message is-error" : "form-message"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null;
}

export function MedicationImportPanel({ items, lots, today, onClose }: Props) {
  const [state, action, pending] = useActionState(importMedicationItemsAction, idle);
  const [preview, setPreview] = useState<MedicationImportPreview | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  useEffect(() => { if (state.status === "success") onClose(); }, [onClose, state.status]);

  async function readFile(file: File | undefined) {
    setFileError(null);
    setPreview(null);
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith(".xlsx")) { setFileError(".xlsx 파일만 업로드할 수 있습니다."); return; }
    if (file.size > 10 * 1024 * 1024) { setFileError("파일 크기는 10MB 이하여야 합니다."); return; }
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, dense: true, sheetRows: 5001 });
      const sheetName = workbook.SheetNames[0];
      const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
      if (!sheet) throw new Error("가져올 수 있는 시트를 찾지 못했습니다.");
      const rawRows = XLSX.utils.sheet_to_json<MedicationImportRawRow>(sheet, { defval: "", raw: true });
      const headers = rawRows[0] ? Object.keys(rawRows[0]) : [];
      if (!headers.length || !rawRows.length) throw new Error("첫 번째 시트에 가져올 행이 없습니다.");
      setPreview(buildMedicationImportPreview(rawRows, items, lots, today, headers));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "엑셀 파일을 읽지 못했습니다.");
    }
  }

  return <div className="medication-import"><div className="medication-import__intro"><p>기존 재고대장의 첫 번째 시트를 읽어 미리보기만 만듭니다. 최종 반영 버튼을 누르기 전에는 DB를 변경하지 않습니다.</p><label className="button button--secondary medication-import__file">엑셀 파일 선택<input accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { void readFile(event.target.files?.[0]); }} type="file" /></label></div>{fileError && <p className="form-message is-error" role="alert">{fileError}</p>}{preview && <><p className="medication-muted">인식된 열: {preview.headers.join(", ")}</p><div className="medication-import__summary" aria-label="업로드 미리보기 요약"><div><span>신규 품목</span><strong>{preview.newItemCount}개</strong></div><div><span>신규 lot</span><strong>{preview.newLotCount}개</strong></div><div><span>기존 품목 매칭</span><strong>{preview.existingItemCount}건</strong></div><div><span>중복 의심</span><strong>{preview.duplicateCount}건</strong></div><div><span>오류 행</span><strong>{preview.errorCount}건</strong></div></div>{preview.missingHeaders.length > 0 && <p className="form-message is-error" role="alert">필수 열을 찾지 못했습니다: {preview.missingHeaders.join(", ")}</p>}<div className="medication-table-wrap medication-import__table"><table className="medication-table"><thead><tr><th>원본 품명</th><th>변환 품명</th><th>분류</th><th>규격/단위</th><th>현재고</th><th>권장재고</th><th>유통기한</th><th>처리 예정</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.rowNumber}><td>{row.originalName || "-"}</td><td>{row.name || "-"}</td><td>{medicationCategoryLabels[row.category]}</td><td>{[row.specification, row.unit].filter(Boolean).join(" / ") || "-"}</td><td>{row.quantity}</td><td>{row.recommendedStock}</td><td>{row.expirationDate || "-"}</td><td><span className={`medication-status medication-status--${row.status === "error" ? "expired" : row.status === "duplicate" ? "replacementSoon" : "normal"}`}>{medicationImportStatusLabels[row.status]}</span>{row.error && <small className="medication-muted">{row.error}</small>}</td></tr>)}</tbody></table></div><form action={action} className="medication-form__footer"><input name="payload" type="hidden" value={JSON.stringify(preview.rows.filter((row) => row.status !== "error"))} /><button className="button button--primary" disabled={pending || preview.rows.every((row) => row.status === "error")} type="submit">{pending ? "반영 중..." : "오류 제외하고 최종 반영"}</button><button className="button button--secondary" onClick={onClose} type="button">취소</button></form><Message state={state} /></>}</div>;
}
