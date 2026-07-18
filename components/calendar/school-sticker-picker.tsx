"use client";

import { useActionState, useRef } from "react";

import { attachCalendarStickerAction, removeCalendarStickerAction } from "@/app/(app)/calendar-sticker-actions";
import { SchoolCalendarSticker } from "@/components/calendar/school-calendar-sticker";
import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { CALENDAR_STICKER_CATALOG, calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import type { CalendarStickerRow } from "@/types/database";

const idle = { status: "idle" as const };

export function SchoolStickerPicker({ stickers, today }: { readonly stickers: readonly CalendarStickerRow[]; readonly today: string }) {
  const [attachState, attachAction, attachPending] = useActionState(attachCalendarStickerAction, idle);
  const [removeState, removeAction, removePending] = useActionState(removeCalendarStickerAction, idle);
  const { openCreate } = useAppShellCreate();
  const eventButtonRef = useRef<HTMLButtonElement>(null);
  const latest = stickers.find((item) => item.sticker_date <= today && (item.end_date ?? item.sticker_date) >= today);

  function openSchoolEvent() {
    if (!latest || !eventButtonRef.current) return;
    const definition = calendarStickerByKey(latest.sticker_key);
    if (!definition) return;
    openCreate(eventButtonRef.current, "event", {
      key: `school-event-${latest.id}`, name: definition.label, kind: "event", area: "schoolSchedule",
      category: "event", title: definition.label, description: "학교 날짜 스티커에서 만든 종일 일정입니다.",
      priority: "normal", estimatedMinutes: 30, recommendedTiming: "선택한 날짜", recurrenceFrequency: null,
      checklist: [], memo: "", startDate: latest.sticker_date, endDate: latest.end_date ?? latest.sticker_date, isAllDay: true,
    });
  }

  return <section className="school-sticker-picker" aria-labelledby="school-sticker-title">
    <div className="school-sticker-picker__heading"><div><strong id="school-sticker-title">날짜 스티커 붙이기</strong><span>학교 일정의 성격을 날짜에 표시합니다.</span></div></div>
    <form action={attachAction} className="school-sticker-picker__form">
      <div className="form-grid"><label className="field"><span className="field-label">시작일</span><input defaultValue={today} name="stickerDate" required type="date" /></label><label className="field"><span className="field-label">종료일</span><input min={today} name="endDate" type="date" /></label></div>
      <div className="school-sticker-grid">{CALENDAR_STICKER_CATALOG.map((item) => <button aria-label={`${item.label} 스티커 붙이기`} disabled={attachPending} key={item.key} name="stickerKey" type="submit" value={item.key}><SchoolCalendarSticker stickerKey={item.key} /></button>)}</div>
    </form>
    {latest && <div className="school-sticker-picker__selected"><SchoolCalendarSticker stickerKey={latest.sticker_key} /><div><strong>{latest.label}</strong><small>{latest.sticker_date}{latest.end_date ? ` ~ ${latest.end_date}` : ""}</small></div><form action={removeAction}><input name="stickerId" type="hidden" value={latest.id} /><button className="text-action" disabled={removePending} type="submit">제거</button></form><button className="button button--secondary" onClick={openSchoolEvent} ref={eventButtonRef} type="button">종일 학교 일정도 만들기</button></div>}
    {(attachState.message || removeState.message) && <p aria-live="polite" className={(attachState.status === "error" || removeState.status === "error") ? "form-message form-message--error" : "form-message"}>{attachState.message ?? removeState.message}</p>}
  </section>;
}
