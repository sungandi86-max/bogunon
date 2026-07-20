"use client";

import { CalendarDays, CheckCircle2, MapPin, Search, School } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  getDefaultNeisSchoolAction,
  importNeisAcademicCalendarAction,
  loadNeisSchedulesAction,
  saveDefaultNeisSchoolAction,
  searchNeisSchoolsAction,
} from "@/app/(app)/neis-academic-calendar-actions";
import type { NeisImportResult } from "@/app/(app)/neis-academic-calendar-actions";
import { NeisSchedulePreview } from "@/components/calendar/neis-schedule-preview";
import { NEIS_OFFICES } from "@/lib/neis/offices";
import type { NeisDefaultSchool, NeisPreviewItem, NeisSchool } from "@/lib/neis/types";

function academicYearRange(): { readonly fromDate: string; readonly toDate: string } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const academicYear = month >= 3 ? year : year - 1;
  const endYear = academicYear + 1;
  const lastFebruaryDay = new Date(Date.UTC(endYear, 2, 0)).getUTCDate();
  return { fromDate: `${academicYear}-03-01`, toDate: `${endYear}-02-${lastFebruaryDay}` };
}

interface NeisAcademicCalendarImportProps {
  readonly onClose?: () => void;
  readonly onComplete?: () => void;
}

export function NeisAcademicCalendarImport({ onClose, onComplete }: NeisAcademicCalendarImportProps) {
  const [initialRange] = useState(academicYearRange);
  const [query, setQuery] = useState("");
  const [officeCode, setOfficeCode] = useState("");
  const [schools, setSchools] = useState<readonly NeisSchool[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<NeisDefaultSchool>();
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const [items, setItems] = useState<readonly NeisPreviewItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<NeisImportResult>();
  const [savedDates, setSavedDates] = useState<readonly string[]>([]);
  const [pendingAction, setPendingAction] = useState<"search" | "load" | "save">();
  const schoolSelectionStarted = useRef(false);

  useEffect(() => {
    let active = true;
    void getDefaultNeisSchoolAction().then((response) => {
      if (!active || schoolSelectionStarted.current) return;
      if (response.status === "error") {
        setMessage(response.message);
        return;
      }
      if (response.school) {
        setSelectedSchool(response.school);
        setOfficeCode(response.school.officeCode);
      }
    });
    return () => { active = false; };
  }, []);

  async function searchSchools(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    schoolSelectionStarted.current = true;
    const queryLength = query.trim().length;
    if ((queryLength === 0 && !officeCode) || queryLength === 1) {
      setMessage("교육청을 선택하거나 학교명을 두 글자 이상 입력해 주세요.");
      return;
    }
    setMessage("");
    setSearched(false);
    setItems([]);
    setLoaded(false);
    setPendingAction("search");
    try {
      const response = await searchNeisSchoolsAction({ query, ...(officeCode ? { officeCode } : {}) });
      if (response.status === "error") {
        setSchools([]);
        setMessage(response.message);
        return;
      }
      setSchools(response.schools);
      setSearched(true);
    } finally {
      setPendingAction(undefined);
    }
  }

  function selectSchool(school: NeisSchool): void {
    schoolSelectionStarted.current = true;
    const selected = { officeCode: school.officeCode, schoolCode: school.schoolCode, name: school.name, officeName: school.officeName };
    setSelectedSchool(selected);
    setOfficeCode(school.officeCode);
    setSchools([]);
    setSearched(false);
    setItems([]);
    setLoaded(false);
    setMessage("");
    setResult(undefined);
    void saveDefaultNeisSchoolAction(selected).then((response) => {
      if (response.status === "error") setMessage(response.message);
    });
  }

  function changeSchool(): void {
    schoolSelectionStarted.current = true;
    setSelectedSchool(undefined);
    setQuery("");
    setSchools([]);
    setItems([]);
    setLoaded(false);
    setMessage("");
  }

  async function loadSchedules(): Promise<void> {
    if (!selectedSchool) return;
    if (!fromDate || !toDate || fromDate > toDate) {
      setMessage("조회 시작일과 종료일을 확인해 주세요.");
      return;
    }
    setMessage("");
    setItems([]);
    setLoaded(false);
    setPendingAction("load");
    try {
      const response = await loadNeisSchedulesAction({
        officeCode: selectedSchool.officeCode,
        schoolCode: selectedSchool.schoolCode,
        schoolName: selectedSchool.name,
        fromDate,
        toDate,
      });
      if (response.status === "error") {
        setMessage(response.message);
        return;
      }
      setItems(response.items);
      setLoaded(true);
    } finally {
      setPendingAction(undefined);
    }
  }

  async function save(effectiveItems: readonly NeisPreviewItem[]): Promise<void> {
    setMessage("");
    setPendingAction("save");
    setSavedDates(effectiveItems.filter((item) => item.selected).map((item) => item.date));
    try {
      const response = await importNeisAcademicCalendarAction(effectiveItems.map((item) => ({
        id: item.id,
        date: item.date,
        title: item.title,
        content: item.content,
        selected: item.selected,
      })));
      if (response.status === "error") {
        setMessage(response.message);
        return;
      }
      setResult(response);
      onComplete?.();
    } finally {
      setPendingAction(undefined);
    }
  }

  if (result?.status === "success") {
    const firstDate = [...savedDates].sort()[0];
    return (
      <div className="academic-import__complete neis-import__complete">
        <CheckCircle2 aria-hidden="true" size={36} />
        <h3>NEIS 학사일정 반영 완료</h3>
        <p>{result.inserted}개 저장 · {result.updated}개 변경 · {result.duplicates}개 중복 제외 · {result.excluded}개 선택 제외 · {result.failed}개 실패</p>
        <div>
          {firstDate && <Link className="button button--primary" href={`/calendar?date=${firstDate}&view=month`}>캘린더에서 확인하기</Link>}
          <button className="button button--secondary" onClick={() => { setResult(undefined); setItems([]); setLoaded(false); }} type="button">다른 일정 불러오기</button>
          {onClose && <button className="button button--secondary" onClick={onClose} type="button">닫기</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="neis-import">
      <header className="neis-import__intro"><span><School aria-hidden="true" size={20} /></span><div><strong>학교를 선택해 학사일정을 바로 가져오세요</strong><p>저장 전 일정과 변경·중복 여부를 확인할 수 있습니다.</p></div></header>
      {!selectedSchool && <form className="neis-import__search" onSubmit={searchSchools}>
        <label><span>시도교육청</span><select onChange={(event) => { schoolSelectionStarted.current = true; setOfficeCode(event.target.value); }} value={officeCode}><option value="">전체 교육청</option>{NEIS_OFFICES.map((office) => <option key={office.code} value={office.code}>{office.name}</option>)}</select></label>
        <label><span>학교명 (선택)</span><input autoComplete="off" maxLength={80} onChange={(event) => { schoolSelectionStarted.current = true; setQuery(event.target.value); }} placeholder="예: 상계고등학교" value={query} /></label>
        <button className="button button--primary" disabled={pendingAction !== undefined || ((query.trim().length === 0 && !officeCode) || query.trim().length === 1)} type="submit"><Search aria-hidden="true" size={17} />{pendingAction === "search" ? "검색 중…" : "학교 검색"}</button>
      </form>}
      {searched && schools.length === 0 && <p className="neis-import__empty" role="status">검색 결과가 없습니다.</p>}
      {schools.length > 0 && <div aria-label="학교 검색 결과" className="neis-import__schools" role="list">{schools.map((school) => <div key={`${school.officeCode}-${school.schoolCode}`} role="listitem"><button aria-label={`${school.name} 선택`} onClick={() => selectSchool(school)} type="button"><span className="neis-import__school-icon"><School aria-hidden="true" size={18} /></span><span><strong>{school.name}</strong><small>{school.type} · {school.region} · {school.officeName}</small><small><MapPin aria-hidden="true" size={13} />{school.address}</small></span></button></div>)}</div>}
      {selectedSchool && <section className="neis-import__selection">
        <div className="neis-import__selected"><span>기본 학교</span><strong>{selectedSchool.name}</strong><small>{selectedSchool.officeName}</small><button onClick={changeSchool} type="button">학교 변경</button></div>
        <div className="neis-import__period"><label><span>조회 시작일</span><input onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} /></label><label><span>조회 종료일</span><input onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} /></label><button className="button button--primary" disabled={pendingAction !== undefined} onClick={() => void loadSchedules()} type="button"><CalendarDays aria-hidden="true" size={17} />{pendingAction === "load" ? "조회 중…" : "학사일정 조회"}</button></div>
      </section>}
      {loaded && items.length === 0 && <p className="neis-import__empty" role="status">선택한 기간에 학사일정이 없습니다.</p>}
      {items.length > 0 && <NeisSchedulePreview items={items} onChangeItems={setItems} {...(onClose ? { onClose } : {})} onSave={(effectiveItems) => void save(effectiveItems)} saving={pendingAction === "save"} />}
      {message && <p className="form-message form-message--error" role="alert">{message}</p>}
    </div>
  );
}
