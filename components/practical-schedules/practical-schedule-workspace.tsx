"use client";

import { ExternalLink, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { deletePracticalScheduleAction, savePracticalScheduleAction } from "@/app/(app)/practical-schedules/actions";
import type { PracticalScheduleCategory, PracticalScheduleRow } from "@/types/database";
import { formatPracticalScheduleDate, practicalScheduleCategoryLabels } from "@/lib/practical-schedules/domain";

const categoryLabels: Record<PracticalScheduleCategory, string> = practicalScheduleCategoryLabels;

function ScheduleForm({ year, initial }: { readonly year: number; readonly initial?: PracticalScheduleRow | undefined }) {
  return <form action={savePracticalScheduleAction} className="practical-schedule-form">
    {initial && <input name="id" type="hidden" value={initial.id} />}
    <input name="year" type="hidden" value={year} />
    <div className="practical-schedule-form__grid">
      <label>구분<select defaultValue={initial?.category ?? "staff"} name="category"><option value="staff">교직원</option><option value="student">학생</option><option value="admin">행정</option></select></label>
      <label className="practical-schedule-form__wide">업무명<input defaultValue={initial?.title ?? ""} maxLength={200} name="title" placeholder="예: 1학년 건강검진" required /></label>
      <label>날짜<input defaultValue={initial?.scheduled_date ?? ""} name="scheduledDate" type="date" /></label>
      <label>시작 시간<input defaultValue={initial?.start_time?.slice(0, 5) ?? ""} name="startTime" type="time" /></label>
      <label>종료 시간<input defaultValue={initial?.end_time?.slice(0, 5) ?? ""} name="endTime" type="time" /></label>
      <label>장소<input defaultValue={initial?.location ?? ""} name="location" placeholder="예: 체육관" /></label>
      <label>진행방법<input defaultValue={initial?.method ?? ""} name="method" placeholder="예: 온라인 이수 + 대면 실습" /></label>
      <label className="practical-schedule-form__wide">확인사항<textarea defaultValue={initial?.notes ?? ""} name="notes" placeholder="준비하거나 확인할 내용을 적어주세요." rows={2} /></label>
      <label className="practical-schedule-form__wide">관련 링크<input defaultValue={initial?.url ?? ""} name="url" placeholder="https://" type="url" /></label>
    </div>
    <div className="practical-schedule-form__footer"><small>날짜가 정해지지 않은 업무도 저장할 수 있습니다.</small><button className="button button--primary" type="submit">{initial ? "변경 저장" : "실무 일정 추가"}</button></div>
  </form>;
}

function ScheduleRow({ item }: { readonly item: PracticalScheduleRow }) {
  return <article className="practical-schedule-row">
    <div className="practical-schedule-row__category"><span className={`practical-category practical-category--${item.category}`}>{categoryLabels[item.category]}</span></div>
    <div className="practical-schedule-row__main"><strong>{item.title}</strong><small>{formatPracticalScheduleDate(item.scheduled_date)}{item.start_time ? ` · ${item.start_time.slice(0, 5)}~${item.end_time?.slice(0, 5) ?? ""}` : ""}</small></div>
    <div className="practical-schedule-row__detail"><span>{item.location || "장소 미정"}</span><span>{item.method || "진행방법 미정"}</span><span>{item.notes || "확인사항 없음"}</span></div>
    <div className="practical-schedule-row__actions">{item.url && <a aria-label={`${item.title} 관련 링크 열기`} href={item.url} rel="noopener noreferrer" target="_blank"><ExternalLink size={15} />바로가기</a>}<details><summary>수정</summary><ScheduleForm initial={item} year={item.year} /></details><form action={deletePracticalScheduleAction}><input name="id" type="hidden" value={item.id} /><button aria-label={`${item.title} 삭제`} className="icon-text-action danger-action" type="submit"><Trash2 size={15} />삭제</button></form></div>
  </article>;
}

export function PracticalScheduleWorkspace({ year, items, newTitle, newMonth, newOpen = false }: { readonly year: number; readonly items: readonly PracticalScheduleRow[]; readonly newTitle?: string | undefined; readonly newMonth?: string | undefined; readonly newOpen?: boolean }) {
  const [formOpen, setFormOpen] = useState(newOpen || Boolean(newTitle));

  return <div className="practical-schedule-workspace">
    <div className="practical-schedule-toolbar"><div><strong>{year}학년도 실무 일정</strong><span>날짜가 확정된 업무는 캘린더와 Today에 자동으로 연결됩니다.</span></div></div>
    <section aria-label={`${year}년 실무 일정 목록`} className="practical-schedule-list"><div className="practical-schedule-list__header"><div><h2>연간 업무 상황판</h2><p>{items.length ? `${items.length}개 업무 · 날짜 미정 업무도 함께 관리합니다.` : "등록된 실무 일정이 없습니다."}</p></div><button className="button button--primary" onClick={() => setFormOpen((open) => !open)} type="button">{formOpen ? <><X size={16} />닫기</> : <><Plus size={16} />실무 일정 추가</>}</button></div>{items.length ? <div className="practical-schedule-table" role="table"><div aria-hidden="true" className="practical-schedule-table__header"><span>구분</span><span>업무·일정</span><span>시간·장소·진행</span><span>관리</span></div>{items.map((item) => <ScheduleRow item={item} key={item.id} />)}</div> : <div className="practical-schedule-empty"><p>아직 등록된 실무 일정이 없습니다.</p><span>올해 진행할 보건실 업무를 등록해 관리해보세요.</span></div>}</section>
    {formOpen && <section className="practical-schedule-add" id="practical-schedule-add"><h2>{newTitle ? "연간 플래너 업무에서 추가" : "새 실무 일정"}</h2>{newTitle && newMonth && <p className="practical-schedule-add__context">{newMonth}월 추천 업무에서 가져왔습니다. 정확한 날짜는 확정 후 입력하세요.</p>}<ScheduleForm initial={newTitle ? { id: "", user_id: "", year, category: "staff", title: newTitle, scheduled_date: null, start_time: null, end_time: null, location: null, method: null, notes: null, url: null, annual_preset_key: null, created_at: "", updated_at: "" } : undefined} year={year} /></section>}
  </div>;
}
