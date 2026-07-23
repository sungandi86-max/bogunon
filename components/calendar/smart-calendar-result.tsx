"use client";

import { AlertTriangle, CalendarCheck } from "lucide-react";
import Link from "next/link";

import type { SmartCalendarSaveResult } from "@/lib/calendar-generator/persistence";

export function SmartCalendarResult({
  calendarDate,
  result,
  year,
  onReset,
}: {
  readonly calendarDate: string;
  readonly result: SmartCalendarSaveResult;
  readonly year: number;
  readonly onReset: () => void;
}) {
  const failures = result.results.filter((item) => item.status === "failed");
  return <section className="smart-calendar-result" aria-labelledby="smart-calendar-result-title">
    {result.summary.failed > 0 ? <AlertTriangle aria-hidden="true" size={38} /> : <CalendarCheck aria-hidden="true" size={38} />}
    <h2 id="smart-calendar-result-title">생성 완료</h2>
    {result.summary.failed === 0 && <p>선택한 일정 처리가 완료되었습니다.</p>}
    <div className="smart-calendar-result__summary" role="status">
      <span><small>생성</small><strong>{result.summary.created}</strong></span>
      <span><small>중복 제외</small><strong>{result.summary.duplicates}</strong></span>
      <span><small>사용자 제외</small><strong>{result.summary.excluded}</strong></span>
      <span className={result.summary.failed > 0 ? "is-danger" : undefined}><small>실패</small><strong>{result.summary.failed}</strong></span>
    </div>
    {failures.length > 0 && <div className="smart-calendar-result__failures">
      <h3>저장하지 못한 일정</h3>
      <ul>{failures.map((item) => <li key={item.clientId}>{item.title} · {item.message}</li>)}</ul>
    </div>}
    <div className="smart-calendar-result__actions">
      <Link className="button button--primary" href={`/calendar?date=${calendarDate}&view=month`}>캘린더 보기</Link>
      <Link className="button button--secondary" href={`/annual?year=${year}`}>연간계획 보기</Link>
      <button className="button button--secondary" onClick={onReset} type="button">다시 생성하기</button>
    </div>
  </section>;
}
