"use client";

import { ExternalLink, Link2, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { deletePracticalScheduleAction, linkExistingEventAction, savePracticalScheduleAction } from "@/app/(app)/practical-schedules/actions";
import { CALENDAR_STICKER_CATALOG } from "@/lib/calendar-stickers/catalog";
import { formatPracticalScheduleDate, practicalScheduleCategoryLabels } from "@/lib/practical-schedules/domain";
import type { EventRow, PracticalScheduleCategory, PracticalScheduleRow } from "@/types/database";

const categoryLabels: Record<PracticalScheduleCategory, string> = practicalScheduleCategoryLabels;

function StickerSelect({ initial }: { readonly initial: string | null | undefined }) {
  return <label>일정 스티커<select defaultValue={initial ?? ""} name="stickerKey"><option value="">선택 안 함</option>{CALENDAR_STICKER_CATALOG.map((sticker) => <option key={sticker.key} value={sticker.key}>{sticker.label}</option>)}</select></label>;
}

function ScheduleForm({ year, initial, linkedReadonly = false }: { readonly year: number; readonly initial?: PracticalScheduleRow | undefined; readonly linkedReadonly?: boolean }) {
  return <form action={savePracticalScheduleAction} className="practical-schedule-form">
    {initial && <input name="id" type="hidden" value={initial.id} />}
    <input name="year" type="hidden" value={year} />
    <div className="practical-schedule-form__grid">
      <label>구분<select defaultValue={initial?.category ?? "staff"} name="category"><option value="staff">교직원</option><option value="student">학생</option><option value="admin">행정</option></select></label>
      <label className="practical-schedule-form__wide">업무명<input defaultValue={initial?.title ?? ""} disabled={linkedReadonly} maxLength={200} name="title" placeholder="예: 1학년 건강검진" required /></label>
      <label>날짜<input defaultValue={initial?.scheduled_date ?? ""} disabled={linkedReadonly} name="scheduledDate" type="date" /></label>
      <label>시작 시간<input defaultValue={initial?.start_time?.slice(0, 5) ?? ""} disabled={linkedReadonly} name="startTime" type="time" /></label>
      <label>종료 시간<input defaultValue={initial?.end_time?.slice(0, 5) ?? ""} disabled={linkedReadonly} name="endTime" type="time" /></label>
      <label>장소<input defaultValue={initial?.location ?? ""} disabled={linkedReadonly} name="location" placeholder="예: 체육관" /></label>
      <label>진행방법<input defaultValue={initial?.method ?? ""} name="method" placeholder="예: 온라인 이수 + 대면 실습" /></label>
      <label className="practical-schedule-form__wide">확인사항<textarea defaultValue={initial?.notes ?? ""} name="notes" placeholder="준비하거나 확인할 내용을 적어주세요." rows={2} /></label>
      <label className="practical-schedule-form__wide">관련 링크<input defaultValue={initial?.url ?? ""} name="url" placeholder="https://" type="url" /></label>
      {!linkedReadonly && <StickerSelect initial={initial?.sticker_key} />}
    </div>
    {linkedReadonly && <><input name="title" type="hidden" value={initial?.title ?? ""} /><input name="scheduledDate" type="hidden" value={initial?.scheduled_date ?? ""} /><input name="startTime" type="hidden" value={initial?.start_time?.slice(0, 5) ?? ""} /><input name="endTime" type="hidden" value={initial?.end_time?.slice(0, 5) ?? ""} /><input name="location" type="hidden" value={initial?.location ?? ""} /><input name="stickerKey" type="hidden" value={initial?.sticker_key ?? ""} /></>}
    {linkedReadonly && <p className="practical-schedule-form__hint">제목·날짜·시간·장소는 캘린더 일정에서 관리합니다.</p>}
    <div className="practical-schedule-form__footer"><small>날짜가 정해지지 않은 업무도 저장할 수 있습니다.</small><button className="button button--primary" type="submit">{initial ? "변경 저장" : "실무 일정 추가"}</button></div>
  </form>;
}

function LinkedEventForm({ year, event }: { readonly year: number; readonly event: EventRow }) {
  return <form action={linkExistingEventAction} className="practical-schedule-form">
    <input name="eventId" type="hidden" value={event.id} />
    <input name="year" type="hidden" value={year} />
    <div className="practical-schedule-linked-event"><strong>{event.title}</strong><span>{formatPracticalScheduleDate(event.start_date)}{event.start_time ? ` · ${event.start_time.slice(0, 5)}~${event.end_time?.slice(0, 5) ?? ""}` : " · 종일"}{event.location ? ` · ${event.location}` : ""}</span></div>
    <div className="practical-schedule-form__grid">
      <label>구분<select defaultValue="staff" name="category"><option value="staff">교직원</option><option value="student">학생</option><option value="admin">행정</option></select></label>
      <label>진행방법<input name="method" placeholder="예: 온라인 이수 + 대면 실습" /></label>
      <label className="practical-schedule-form__wide">확인사항<textarea name="notes" placeholder="준비하거나 확인할 내용을 적어주세요." rows={2} /></label>
      <label className="practical-schedule-form__wide">관련 링크<input name="url" placeholder="https://" type="url" /></label>
    </div>
    <div className="practical-schedule-form__footer"><small>캘린더의 제목·날짜·시간·장소·스티커를 그대로 유지합니다.</small><button className="button button--primary" type="submit"><Link2 size={16} />기존 일정에 연결</button></div>
  </form>;
}

function ScheduleRow({ item, linkedReadonly }: { readonly item: PracticalScheduleRow; readonly linkedReadonly: boolean }) {
  return <article className="practical-schedule-row">
    <div className="practical-schedule-row__category"><span className={`practical-category practical-category--${item.category}`}>{categoryLabels[item.category]}</span></div>
    <div className="practical-schedule-row__main"><strong>{item.title}</strong><small>{formatPracticalScheduleDate(item.scheduled_date)}{item.start_time ? ` · ${item.start_time.slice(0, 5)}~${item.end_time?.slice(0, 5) ?? ""}` : ""}</small></div>
    <div className="practical-schedule-row__detail"><span>{item.location || "장소 미정"}</span><span>{item.method || "진행방법 미정"}</span><span>{item.notes || "확인사항 없음"}</span></div>
    <div className="practical-schedule-row__actions">{item.url && <a aria-label={`${item.title} 관련 링크 열기`} href={item.url} rel="noopener noreferrer" target="_blank"><ExternalLink size={15} />바로가기</a>}<details><summary>수정</summary><ScheduleForm initial={item} linkedReadonly={linkedReadonly} year={item.year} /></details><form action={deletePracticalScheduleAction}><input name="id" type="hidden" value={item.id} /><button aria-label={`${item.title} 삭제`} className="icon-text-action danger-action" type="submit"><Trash2 size={15} />삭제</button></form></div>
  </article>;
}

export function PracticalScheduleWorkspace({ year, items, linkableEvents, linkedScheduleIds = [], newTitle, newMonth, newOpen = false }: { readonly year: number; readonly items: readonly PracticalScheduleRow[]; readonly linkableEvents: readonly EventRow[]; readonly linkedScheduleIds?: readonly string[]; readonly newTitle?: string | undefined; readonly newMonth?: string | undefined; readonly newOpen?: boolean }) {
  const [formOpen, setFormOpen] = useState(newOpen || Boolean(newTitle));
  const [mode, setMode] = useState<"new" | "link">("new");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [query, setQuery] = useState("");
  const visibleEvents = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return linkableEvents.filter((event) => !normalized || event.title.toLocaleLowerCase().includes(normalized));
  }, [linkableEvents, query]);
  const selectedEvent = visibleEvents.find((event) => event.id === selectedEventId);
  const linkedScheduleIdSet = useMemo(() => new Set(linkedScheduleIds), [linkedScheduleIds]);

  return <div className="practical-schedule-workspace">
    <div className="practical-schedule-toolbar"><div><strong>{year}학년도 실무 일정</strong><span>날짜가 확정된 업무는 캘린더와 Today에 자동으로 연결됩니다.</span></div></div>
    <section aria-label={`${year}년 실무 일정 목록`} className="practical-schedule-list"><div className="practical-schedule-list__header"><div><h2>연간 업무 상황판</h2><p>{items.length ? `${items.length}개 업무 · 날짜 미정 업무도 함께 관리합니다.` : "등록된 실무 일정이 없습니다."}</p></div><button className="button button--primary" onClick={() => setFormOpen((open) => !open)} type="button">{formOpen ? <><X size={16} />닫기</> : <><Plus size={16} />실무 일정 추가</>}</button></div>{items.length ? <div className="practical-schedule-table" role="table"><div aria-hidden="true" className="practical-schedule-table__header"><span>구분</span><span>업무·일정</span><span>시간·장소·진행</span><span>관리</span></div>{items.map((item) => <ScheduleRow item={item} key={item.id} linkedReadonly={linkedScheduleIdSet.has(item.id)} />)}</div> : <div className="practical-schedule-empty"><p>아직 등록된 실무 일정이 없습니다.</p><span>올해 진행할 보건실 업무를 등록해 관리해보세요.</span></div>}</section>
    {formOpen && <section className="practical-schedule-add" id="practical-schedule-add"><div className="practical-schedule-mode" role="tablist" aria-label="실무 일정 추가 방식"><button aria-selected={mode === "new"} className={mode === "new" ? "is-active" : undefined} onClick={() => setMode("new")} role="tab" type="button"><Plus size={15} />새 실무 일정 만들기</button><button aria-selected={mode === "link"} className={mode === "link" ? "is-active" : undefined} onClick={() => setMode("link")} role="tab" type="button"><Link2 size={15} />기존 일정 연결</button></div>{mode === "new" ? <><h2>{newTitle ? "연간 플래너 업무에서 추가" : "새 실무 일정"}</h2>{newTitle && newMonth && <p className="practical-schedule-add__context">{newMonth}월 추천 업무에서 가져왔습니다. 정확한 날짜는 확정 후 입력하세요.</p>}<ScheduleForm initial={newTitle ? { id: "", user_id: "", year, category: "staff", title: newTitle, scheduled_date: null, start_time: null, end_time: null, location: null, method: null, notes: null, url: null, annual_preset_key: null, sticker_key: null, created_at: "", updated_at: "" } : undefined} year={year} /></> : <><h2>기존 캘린더 일정 연결</h2><p className="practical-schedule-add__context">이미 등록된 일정을 선택하면 새 캘린더 event를 만들지 않고 실무 일정으로 연결합니다.</p><label className="practical-schedule-event-search">일정 검색<input onChange={(event) => setQuery(event.target.value)} placeholder="일정 제목으로 검색" type="search" value={query} /></label><div className="practical-schedule-event-list">{visibleEvents.length ? visibleEvents.map((event) => <button className={selectedEventId === event.id ? "is-selected" : undefined} key={event.id} onClick={() => setSelectedEventId(event.id)} type="button"><strong>{event.title}</strong><span>{formatPracticalScheduleDate(event.start_date)}{event.start_time ? ` · ${event.start_time.slice(0, 5)}~${event.end_time?.slice(0, 5) ?? ""}` : " · 종일"}{event.sticker_key ? " · 스티커 있음" : ""}</span></button>) : <p>연결할 수 있는 일정이 없습니다.</p>}</div>{selectedEvent ? <LinkedEventForm event={selectedEvent} year={year} /> : <p className="practical-schedule-add__hint">연결할 일정을 선택하세요.</p>}</>}</section>}
  </div>;
}
