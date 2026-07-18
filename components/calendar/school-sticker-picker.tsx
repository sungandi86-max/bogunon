"use client";

import { useActionState, useRef, useState } from "react";

import { attachCalendarStickerAction, removeCalendarStickerAction } from "@/app/(app)/calendar-sticker-actions";
import { CalendarDateSticker } from "@/components/calendar/calendar-date-sticker";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import {
  PERSONAL_CALENDAR_STICKERS,
  SCHOOL_CALENDAR_STICKERS,
  calendarStickerByKey,
  calendarStickerCategory,
  type CalendarStickerCategory,
} from "@/lib/calendar-stickers/catalog";
import type { CalendarStickerRow } from "@/types/database";

const idle = { status: "idle" as const };

export function SchoolStickerPicker({ stickers, today }: { readonly stickers: readonly CalendarStickerRow[]; readonly today: string }) {
  const [category, setCategory] = useState<CalendarStickerCategory>("school");
  const [attachState, attachAction, attachPending] = useActionState(attachCalendarStickerAction, idle);
  const [removeState, removeAction, removePending] = useActionState(removeCalendarStickerAction, idle);
  const { openCreate } = useAppShellCreate();
  const eventButtonRef = useRef<HTMLButtonElement>(null);
  const catalog = category === "school" ? SCHOOL_CALENDAR_STICKERS : PERSONAL_CALENDAR_STICKERS;
  const selected = stickers.filter((item) => item.sticker_date <= today && (item.end_date ?? item.sticker_date) >= today && calendarStickerCategory(item.sticker_key) === category);
  const latest = selected.at(-1);

  function openLinkedEvent() {
    if (!latest || !eventButtonRef.current) return;
    const definition = calendarStickerByKey(latest.sticker_key);
    if (!definition) return;
    const personal = category === "personal";
    openCreate(eventButtonRef.current, "event", {
      key: `${personal ? "personal" : "school"}-event-${latest.id}`,
      name: definition.label,
      kind: "event",
      area: personal ? "personal" : "schoolSchedule",
      category: "event",
      title: definition.label,
      description: personal ? "개인 날짜 스티커에서 시작한 일정입니다." : "학교 날짜 스티커에서 시작한 종일 일정입니다.",
      priority: "normal",
      estimatedMinutes: 30,
      recommendedTiming: "선택한 날짜",
      recurrenceFrequency: null,
      checklist: [],
      memo: "",
      startDate: latest.sticker_date,
      endDate: latest.end_date ?? latest.sticker_date,
      isAllDay: true,
    });
  }

  return <section className="school-sticker-picker" aria-labelledby="calendar-sticker-title">
    <div className="school-sticker-picker__heading"><div><strong id="calendar-sticker-title">날짜 스티커 붙이기</strong><span>학교나 개인 일정의 성격을 날짜에 표시합니다.</span></div></div>
    <div aria-label="날짜 스티커 카테고리" className="calendar-sticker-tabs" role="tablist">
      <button aria-controls="calendar-sticker-panel" aria-selected={category === "school"} id="calendar-sticker-school-tab" onClick={() => setCategory("school")} role="tab" type="button">학교 일정</button>
      <button aria-controls="calendar-sticker-panel" aria-selected={category === "personal"} id="calendar-sticker-personal-tab" onClick={() => setCategory("personal")} role="tab" type="button">개인 일정</button>
    </div>
    <form action={attachAction} aria-labelledby={`calendar-sticker-${category}-tab`} className="school-sticker-picker__form" id="calendar-sticker-panel" role="tabpanel">
      <div className="form-grid"><label className="field"><span className="field-label">시작일</span><CalendarDateInput defaultValue={today} name="stickerDate" required /></label><label className="field"><span className="field-label">종료일</span><CalendarDateInput min={today} name="endDate" /></label></div>
      <div className="school-sticker-grid">{catalog.map((item) => <button aria-label={`${item.label} 스티커 붙이기`} disabled={attachPending} key={item.key} name="stickerKey" type="submit" value={item.key}><CalendarDateSticker stickerKey={item.key} /></button>)}</div>
    </form>
    {selected.map((item) => <div className="school-sticker-picker__selected" key={item.id}><CalendarDateSticker stickerKey={item.sticker_key} /><div><strong>{item.label}</strong><small>{item.sticker_date}{item.end_date ? ` ~ ${item.end_date}` : ""}</small></div><form action={removeAction}><input name="stickerId" type="hidden" value={item.id} /><button className="text-action" disabled={removePending} type="submit">제거</button></form>{item.id === latest?.id && <button className="button button--secondary" onClick={openLinkedEvent} ref={eventButtonRef} type="button">{category === "personal" ? "개인 일정도 만들기" : "종일 학교 일정도 만들기"}</button>}</div>)}
    {(attachState.message || removeState.message) && <p aria-live="polite" className={(attachState.status === "error" || removeState.status === "error") ? "form-message form-message--error" : "form-message"}>{attachState.message ?? removeState.message}</p>}
  </section>;
}
