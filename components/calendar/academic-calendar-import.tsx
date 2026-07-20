"use client";

import { AlertTriangle, CheckCircle2, FileSpreadsheet, RotateCcw, Upload, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";

import {
  checkAcademicDuplicatesAction,
  importAcademicCalendarAction,
} from "@/app/(app)/academic-calendar-import-actions";
import type { AcademicImportActionResult, AcademicImportPayload } from "@/app/(app)/academic-calendar-import-actions";
import { ACADEMIC_IMPORT_ACCEPT, AcademicImportFileError, readAcademicWorkbook } from "@/lib/academic-calendar-import/file";
import { detectAcademicColumns, parseAcademicRows } from "@/lib/academic-calendar-import/parser";
import type { AcademicColumnMapping, AcademicImportItem, AcademicWorkbook } from "@/lib/academic-calendar-import/types";

const statusLabel = {
  ready: "정상", needsReview: "확인 필요", dateError: "날짜 오류", missingTitle: "일정명 없음", duplicate: "중복 가능", excluded: "제외됨",
} as const;

function currentSeoulYear(): number {
  return Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Seoul" }).format(new Date()));
}

function mappingValue(value: number | undefined): string { return value === undefined ? "" : String(value); }

export function AcademicCalendarImport({ onClose, onComplete }: { readonly onClose?: () => void; readonly onComplete?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [workbook, setWorkbook] = useState<AcademicWorkbook>();
  const [sheetIndex, setSheetIndex] = useState(0);
  const [academicYear, setAcademicYear] = useState(currentSeoulYear);
  const [academicYearMode, setAcademicYearMode] = useState(true);
  const [mapping, setMapping] = useState<AcademicColumnMapping>({ headerRow: 0 });
  const [items, setItems] = useState<readonly AcademicImportItem[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<AcademicImportActionResult>();
  const [isPending, startTransition] = useTransition();
  const sheet = workbook?.sheets[sheetIndex];
  const columns = useMemo(() => Math.max(0, ...(sheet?.rows.map((row) => row.length) ?? [0])), [sheet]);
  const summary = useMemo(() => ({
    total: items.length,
    selected: items.filter((item) => item.selected).length,
    review: items.filter((item) => item.status === "dateError" || item.status === "missingTitle" || item.status === "needsReview").length,
    duplicates: items.filter((item) => item.status === "duplicate").length,
    excluded: items.filter((item) => !item.selected).length,
  }), [items]);

  function reset(): void {
    if (inputRef.current) inputRef.current.value = "";
    setWorkbook(undefined); setItems([]); setStep(1); setMessage(""); setResult(undefined);
  }

  async function chooseFile(file: File | undefined): Promise<void> {
    if (!file) return;
    setMessage(""); setItems([]);
    try {
      const next = await readAcademicWorkbook(file);
      const likelyIndex = next.sheets.findIndex((candidate) => candidate.likely);
      const nextIndex = likelyIndex >= 0 ? likelyIndex : 0;
      setWorkbook(next); setSheetIndex(nextIndex);
      setMapping(detectAcademicColumns(next.sheets[nextIndex]?.rows ?? []));
    } catch (error) {
      setWorkbook(undefined);
      setMessage(error instanceof AcademicImportFileError ? error.message : "파일을 분석하지 못했습니다.");
    }
  }

  function selectSheet(index: number): void {
    setSheetIndex(index);
    setMapping(detectAcademicColumns(workbook?.sheets[index]?.rows ?? []));
  }

  function analyze(): void {
    if (!sheet) return;
    const parsed = parseAcademicRows(sheet.rows, { academicYear, academicYearMode }, mapping);
    if (!parsed.items.length) { setMessage("선택한 시트에서 일정 데이터를 찾지 못했습니다."); return; }
    setMessage("");
    startTransition(async () => {
      try {
        setItems(await checkAcademicDuplicatesAction(parsed.items));
        setStep(2);
      } catch (error) {
        setItems(parsed.items);
        setStep(2);
        setMessage(error instanceof Error ? error.message : "기존 일정과 중복 여부를 확인하지 못했습니다.");
      }
    });
  }

  function updateItem(id: string, patch: Partial<AcademicImportItem>): void {
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...patch };
      if (Object.keys(patch).every((key) => key === "selected")) return next;
      const status = !next.title.trim() ? "missingTitle" : !next.startDate || !next.endDate || next.endDate < next.startDate ? "dateError" : "ready";
      return { ...next, status };
    }));
  }

  function submit(): void {
    const payload: readonly AcademicImportPayload[] = items.map((item) => ({
      title: item.title, startDate: item.startDate, endDate: item.endDate,
      selected: item.selected, allowDuplicate: item.status === "duplicate" && item.selected,
    }));
    startTransition(async () => {
      const next = await importAcademicCalendarAction(payload);
      setResult(next);
      if (next.status === "success" && next.inserted > 0 && next.failed === 0) { setStep(3); onComplete?.(); }
      else setMessage(next.message);
    });
  }

  const earliestDate = items.filter((item) => item.selected && item.startDate).map((item) => item.startDate).sort()[0];
  return <div className="academic-import">
    <ol aria-label="가져오기 진행 단계" className="academic-import__steps">
      {["파일 선택", "일정 확인", "등록 완료"].map((label, index) => <li aria-current={step === index + 1 ? "step" : undefined} className={step >= index + 1 ? "is-active" : ""} key={label}><span>{index + 1}</span>{label}</li>)}
    </ol>
    {step === 1 && <div className="academic-import__upload-step">
      <p>학교에서 받은 엑셀 또는 CSV 파일을 올리면 날짜와 일정을 확인한 뒤 캘린더에 등록할 수 있습니다.</p>
      <div className="academic-import__dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void chooseFile(event.dataTransfer.files[0]); }}>
        <Upload aria-hidden="true" size={28} />
        <strong>파일을 끌어놓거나 선택하세요</strong>
        <span>.xlsx, .xls, .csv · 최대 10MB</span>
        <button className="button button--secondary" onClick={() => inputRef.current?.click()} type="button">파일 선택</button>
        <input accept={ACADEMIC_IMPORT_ACCEPT} aria-label="학사일정 파일 선택" className="visually-hidden" onChange={(event) => void chooseFile(event.target.files?.[0])} ref={inputRef} type="file" />
      </div>
      {workbook && sheet && <section className="academic-import__settings">
        <div className="academic-import__file"><FileSpreadsheet aria-hidden="true" size={19} /><span><strong>{workbook.fileName}</strong><small>{workbook.sheets.length}개 시트</small></span><button aria-label="선택한 파일 제거" onClick={reset} type="button"><X size={17} /></button></div>
        <div className="academic-import__settings-grid">
          <label>가져올 시트<select onChange={(event) => selectSheet(Number(event.target.value))} value={sheetIndex}>{workbook.sheets.map((candidate, index) => <option key={candidate.name} value={index}>{candidate.name}{candidate.likely ? " · 일정 가능성 높음" : ""}</option>)}</select></label>
          <label>기준 연도<input max="2100" min="2000" onChange={(event) => setAcademicYear(Number(event.target.value))} type="number" value={academicYear} /></label>
          <label className="academic-import__year-mode"><input checked={academicYearMode} onChange={(event) => setAcademicYearMode(event.target.checked)} type="checkbox" />학년도 기준으로 날짜 계산</label>
        </div>
        <details className="academic-import__mapping"><summary>열 직접 선택</summary><div>{(["dateColumn", "startDateColumn", "endDateColumn", "monthColumn", "dayColumn", "titleColumn"] as const).map((key) => <label key={key}>{({ dateColumn: "날짜/기간", startDateColumn: "시작일", endDateColumn: "종료일", monthColumn: "월", dayColumn: "일", titleColumn: "일정명" })[key]}<select onChange={(event) => setMapping((current) => ({ ...current, [key]: event.target.value === "" ? undefined : Number(event.target.value) }))} value={mappingValue(mapping[key])}><option value="">선택 안 함</option>{Array.from({ length: columns }, (_, index) => <option key={index} value={index}>{index + 1}열 · {String(sheet.rows[mapping.headerRow]?.[index] ?? "")}</option>)}</select></label>)}</div></details>
        <button className="button button--primary" disabled={isPending} onClick={analyze} type="button">{isPending ? "분석 중…" : "일정 분석하기"}</button>
      </section>}
    </div>}
    {step === 2 && <div className="academic-import__preview">
      <div className="academic-import__summary" role="status"><span>전체 <strong>{summary.total}</strong></span><span>등록 예정 <strong>{summary.selected}</strong></span><span>확인 필요 <strong>{summary.review}</strong></span><span>중복 가능 <strong>{summary.duplicates}</strong></span><span>제외 <strong>{summary.excluded}</strong></span></div>
      <div className="academic-import__bulk"><label><input checked={items.length > 0 && items.every((item) => item.selected)} onChange={(event) => setItems((current) => current.map((item) => item.status === "dateError" || item.status === "missingTitle" ? item : { ...item, selected: event.target.checked }))} type="checkbox" />전체 선택</label><button onClick={() => setStep(1)} type="button"><RotateCcw size={15} />다시 분석</button></div>
      <div aria-label="학사일정 미리보기" className="academic-import__table" role="list">
        <div aria-hidden="true" className="academic-import__row academic-import__row--header"><span>선택</span><span>상태</span><span>날짜 또는 기간</span><span>일정명</span><span>분류</span><span>원본 행</span></div>
        {items.map((item) => <div className="academic-import__row" key={item.id} role="listitem">
          <label className="academic-import__select"><input aria-label={`${item.sourceRow}행 등록 선택`} checked={item.selected} disabled={item.status === "dateError" || item.status === "missingTitle"} onChange={(event) => updateItem(item.id, { selected: event.target.checked })} type="checkbox" /></label>
          <span className={`academic-import__status is-${item.status}`}>{item.status === "ready" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{statusLabel[item.status]}</span>
          <span className="academic-import__dates"><input aria-label={`${item.sourceRow}행 시작일`} onChange={(event) => updateItem(item.id, { startDate: event.target.value })} type="date" value={item.startDate} /><span>~</span><input aria-label={`${item.sourceRow}행 종료일`} onChange={(event) => updateItem(item.id, { endDate: event.target.value })} type="date" value={item.endDate} /></span>
          <input aria-label={`${item.sourceRow}행 일정명`} className="academic-import__title" maxLength={200} onChange={(event) => updateItem(item.id, { title: event.target.value })} value={item.title} />
          <span className="academic-import__category">학교 · 종일</span><span className="academic-import__source">{item.sourceRow}행</span>
        </div>)}
      </div>
      <div className="academic-import__privacy">선택한 날짜와 일정명만 등록됩니다. 원본 파일과 선택하지 않은 열은 서버에 저장하거나 외부 서비스로 전송하지 않습니다.</div>
      <button className="button button--primary academic-import__submit" disabled={isPending || summary.selected === 0} onClick={submit} type="button">{isPending ? "등록 중…" : `선택한 일정 ${summary.selected}개 등록`}</button>
    </div>}
    {step === 3 && result && <div className="academic-import__complete"><CheckCircle2 aria-hidden="true" size={36} /><h3>학사일정 등록 완료</h3><p>{result.inserted}개 등록 · {result.duplicates}개 중복 제외 · {result.excluded}개 선택 제외 · {result.failed}개 오류</p><div>{earliestDate && <Link className="button button--primary" href={`/calendar?date=${earliestDate}&view=month`}>캘린더에서 확인하기</Link>}<button className="button button--secondary" onClick={reset} type="button">다른 파일 가져오기</button>{onClose && <button className="button button--secondary" onClick={onClose} type="button">닫기</button>}</div></div>}
    {message && <p className="form-message form-message--error" role="alert">{message}</p>}
  </div>;
}
