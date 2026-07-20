"use client";

import { CalendarDays, CheckCircle2, MapPin, Search, School } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { importNeisAcademicCalendarAction, loadNeisSchedulesAction, searchNeisSchoolsAction } from "@/app/(app)/neis-academic-calendar-actions";
import type { NeisImportResult } from "@/app/(app)/neis-academic-calendar-actions";
import { NEIS_OFFICES } from "@/lib/neis/offices";
import type { NeisPreviewItem, NeisSchool } from "@/lib/neis/types";

function academicYearRange(): { readonly fromDate: string; readonly toDate: string } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const academicYear = month >= 3 ? year : year - 1;
  const endYear = academicYear + 1;
  const lastFebruaryDay = new Date(Date.UTC(endYear, 2, 0)).getUTCDate();
  return { fromDate: `${academicYear}-03-01`, toDate: `${endYear}-02-${lastFebruaryDay}` };
}

function displayDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

export function NeisAcademicCalendarImport({ onClose, onComplete }: { readonly onClose?: () => void; readonly onComplete?: () => void }) {
  const [initialRange] = useState(academicYearRange);
  const [query, setQuery] = useState("");
  const [officeCode, setOfficeCode] = useState("");
  const [schools, setSchools] = useState<readonly NeisSchool[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<NeisSchool>();
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const [items, setItems] = useState<readonly NeisPreviewItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<NeisImportResult>();
  const [pendingAction, setPendingAction] = useState<"search" | "load" | "save">();
  const selectedCount = items.filter((item) => item.selected).length;

  async function searchSchools(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const queryLength = query.trim().length;
    if ((queryLength === 0 && !officeCode) || queryLength === 1) { setMessage("교육청을 선택하거나 학교명을 두 글자 이상 입력해 주세요."); return; }
    setMessage(""); setSearched(false); setSelectedSchool(undefined); setItems([]); setLoaded(false);
    setPendingAction("search");
    try {
      const response = await searchNeisSchoolsAction({ query, ...(officeCode ? { officeCode } : {}) });
      if (response.status === "error") { setSchools([]); setMessage(response.message); return; }
      setSchools(response.schools); setSearched(true);
    } finally { setPendingAction(undefined); }
  }

  function selectSchool(school: NeisSchool): void {
    setSelectedSchool(school); setSchools([]); setSearched(false); setItems([]); setLoaded(false); setMessage(""); setResult(undefined);
  }

  async function loadSchedules(): Promise<void> {
    if (!selectedSchool) return;
    if (!fromDate || !toDate || fromDate > toDate) { setMessage("조회 시작일과 종료일을 확인해 주세요."); return; }
    setMessage(""); setItems([]); setLoaded(false);
    setPendingAction("load");
    try {
      const response = await loadNeisSchedulesAction({
        officeCode: selectedSchool.officeCode, schoolCode: selectedSchool.schoolCode, schoolName: selectedSchool.name, fromDate, toDate,
      });
      if (response.status === "error") { setItems([]); setMessage(response.message); return; }
      setItems(response.items); setLoaded(true);
    } finally { setPendingAction(undefined); }
  }

  function toggleItem(id: string, selected: boolean): void {
    setItems((current) => current.map((item) => item.id === id ? { ...item, selected } : item));
  }

  function selectAll(selected: boolean): void {
    setItems((current) => current.map((item) => item.status === "duplicate" ? item : { ...item, selected }));
  }

  async function save(): Promise<void> {
    setMessage("");
    setPendingAction("save");
    try {
      const response = await importNeisAcademicCalendarAction(items.map((item) => ({ id: item.id, date: item.date, title: item.title, selected: item.selected })));
      if (response.status === "error") { setMessage(response.message); return; }
      setResult(response); onComplete?.();
    } finally { setPendingAction(undefined); }
  }

  if (result?.status === "success") {
    const firstDate = items.filter((item) => item.selected).map((item) => item.date).sort()[0];
    return <div className="academic-import__complete neis-import__complete"><CheckCircle2 aria-hidden="true" size={36} /><h3>NEIS 학사일정 등록 완료</h3><p>{result.inserted}개 저장 · {result.duplicates}개 중복 제외 · {result.excluded}개 선택 제외 · {result.failed}개 실패</p><div>{firstDate && <Link className="button button--primary" href={`/calendar?date=${firstDate}&view=month`}>캘린더에서 확인하기</Link>}<button className="button button--secondary" onClick={() => { setResult(undefined); setItems([]); setLoaded(false); }} type="button">다른 일정 불러오기</button>{onClose && <button className="button button--secondary" onClick={onClose} type="button">닫기</button>}</div></div>;
  }

  return <div className="neis-import">
    <header className="neis-import__intro"><span><School aria-hidden="true" size={20} /></span><div><strong>학교를 선택해 학사일정을 바로 가져오세요</strong><p>저장 전 일정과 중복 여부를 확인할 수 있습니다.</p></div></header>
    <form className="neis-import__search" onSubmit={searchSchools}>
      <label><span>시도교육청</span><select onChange={(event) => setOfficeCode(event.target.value)} value={officeCode}><option value="">전체 교육청</option>{NEIS_OFFICES.map((office) => <option key={office.code} value={office.code}>{office.name}</option>)}</select></label>
      <label><span>학교명 (선택)</span><input autoComplete="off" maxLength={80} onChange={(event) => setQuery(event.target.value)} placeholder="예: 상계고등학교" value={query} /></label>
      <button className="button button--primary" disabled={pendingAction !== undefined || ((query.trim().length === 0 && !officeCode) || query.trim().length === 1)} type="submit"><Search aria-hidden="true" size={17} />{pendingAction === "search" ? "검색 중…" : "학교 검색"}</button>
    </form>
    {searched && schools.length === 0 && <p className="neis-import__empty" role="status">검색 결과가 없습니다.</p>}
    {schools.length > 0 && <div aria-label="학교 검색 결과" className="neis-import__schools" role="list">{schools.map((school) => <div key={`${school.officeCode}-${school.schoolCode}`} role="listitem"><button aria-label={`${school.name} 선택`} onClick={() => selectSchool(school)} type="button"><span className="neis-import__school-icon"><School aria-hidden="true" size={18} /></span><span><strong>{school.name}</strong><small>{school.type} · {school.region} · {school.officeName}</small><small><MapPin aria-hidden="true" size={13} />{school.address}</small></span></button></div>)}</div>}
    {selectedSchool && <section className="neis-import__selection">
      <div className="neis-import__selected"><span>선택한 학교</span><strong>{selectedSchool.name}</strong><small>{selectedSchool.type} · {selectedSchool.officeName}</small><button onClick={() => { setSelectedSchool(undefined); setItems([]); setLoaded(false); }} type="button">학교 변경</button></div>
      <div className="neis-import__period"><label><span>조회 시작일</span><input onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} /></label><label><span>조회 종료일</span><input onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} /></label><button className="button button--primary" disabled={pendingAction !== undefined} onClick={() => void loadSchedules()} type="button"><CalendarDays aria-hidden="true" size={17} />{pendingAction === "load" ? "조회 중…" : "학사일정 조회"}</button></div>
    </section>}
    {loaded && items.length === 0 && <p className="neis-import__empty" role="status">선택한 기간에 학사일정이 없습니다.</p>}
    {items.length > 0 && <section className="neis-import__preview">
      <div className="neis-import__preview-header"><div><h3>학사일정 미리보기</h3><p>전체 {items.length}개 · 선택 {selectedCount}개</p></div><div><button onClick={() => selectAll(true)} type="button">전체 선택</button><button onClick={() => selectAll(false)} type="button">전체 해제</button></div></div>
      <div aria-label="NEIS 학사일정 미리보기" className="neis-import__list" role="list">{items.map((item) => <label className={item.status === "duplicate" ? "is-duplicate" : ""} key={item.id} role="listitem"><input checked={item.selected} disabled={item.status === "duplicate"} onChange={(event) => toggleItem(item.id, event.target.checked)} type="checkbox" /><time dateTime={item.date}>{displayDate(item.date)}</time><span><strong>{item.title}</strong>{item.content && <small>{item.content}</small>}<small>대상: {item.grades.length ? item.grades.join(", ") : "학년 정보 없음"}</small></span>{item.status === "duplicate" && <b>이미 등록됨</b>}</label>)}</div>
      <p className="academic-import__privacy">API 키는 서버에서만 사용되며, 선택한 일정만 내 캘린더에 저장됩니다.</p>
      <button className="button button--primary neis-import__submit" disabled={pendingAction !== undefined || selectedCount === 0} onClick={() => void save()} type="button">{pendingAction === "save" ? "저장 중…" : `선택한 일정 ${selectedCount}개 저장`}</button>
    </section>}
    {message && <p className="form-message form-message--error" role="alert">{message}</p>}
  </div>;
}
