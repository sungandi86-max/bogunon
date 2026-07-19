"use client";

import { Check, Search, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { attachCalendarStickerAction, removeCalendarStickerAction } from "@/app/(app)/calendar-sticker-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { CalendarDateSticker } from "@/components/calendar/calendar-date-sticker";
import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import {
  ACADEMIC_CALENDAR_STICKERS,
  HEALTH_CALENDAR_STICKERS,
  PERSONAL_CALENDAR_STICKERS,
  SCHOOL_CALENDAR_STICKERS,
  calendarStickerByKey,
  filterCalendarStickers,
  type CalendarStickerGroup,
  type CalendarStickerPack,
} from "@/lib/calendar-stickers/catalog";
import type { CalendarStickerRow } from "@/types/database";

const idle = { status: "idle" as const };
const packs = [["school", "학교"], ["academic", "학사일정"], ["health", "보건업무"], ["personal", "개인"]] as const satisfies readonly (readonly [CalendarStickerPack, string])[];
const academicGroups = [["all", "전체"], ["semester", "학기"], ["exam", "시험"], ["event", "행사"], ["operation", "운영"]] as const satisfies readonly (readonly [CalendarStickerGroup | "all", string])[];
const healthGroups = [["all", "전체"], ["screening", "건강검사"], ["education", "보건교육"], ["operation", "운영·점검"], ["administration", "행정·협업"]] as const satisfies readonly (readonly [CalendarStickerGroup | "all", string])[];

function catalogForPack(pack: CalendarStickerPack) {
  if (pack === "academic") return ACADEMIC_CALENDAR_STICKERS;
  if (pack === "health") return HEALTH_CALENDAR_STICKERS;
  if (pack === "personal") return PERSONAL_CALENDAR_STICKERS;
  return SCHOOL_CALENDAR_STICKERS;
}

function groupsForPack(pack: CalendarStickerPack) {
  if (pack === "academic") return academicGroups;
  if (pack === "health") return healthGroups;
  return [];
}

function dateLabel(date: string): string {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
}

export function SchoolStickerPicker({ stickers, today }: { readonly stickers: readonly CalendarStickerRow[]; readonly today: string }) {
  const [pack, setPack] = useState<CalendarStickerPack>("school");
  const [group, setGroup] = useState<CalendarStickerGroup | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [attachState, attachAction, attachPending] = useActionState(attachCalendarStickerAction, idle);
  const [removeState, removeAction, removePending] = useActionState(removeCalendarStickerAction, idle);
  const { openCreate } = useAppShellCreate();
  const eventButtonRef = useRef<HTMLButtonElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const catalog = catalogForPack(pack);
  const groups = groupsForPack(pack);
  const visibleCatalog = useMemo(() => filterCalendarStickers(catalog, query, groups.length > 0 ? group : "all"), [catalog, group, groups.length, query]);
  const selected = stickers.filter((item) => {
    const definition = calendarStickerByKey(item.sticker_key);
    return item.sticker_date <= today && (item.end_date ?? item.sticker_date) >= today && definition?.pack === pack;
  });
  const latest = selected.at(-1);

  useEffect(() => {
    if (typeof activeTabRef.current?.scrollIntoView === "function") {
      activeTabRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [pack]);

  function selectPack(nextPack: CalendarStickerPack): void {
    setPack(nextPack);
    setGroup("all");
    setQuery("");
    setSelectedKey(null);
  }

  function openLinkedEvent(): void {
    if (!latest || !eventButtonRef.current) return;
    const definition = calendarStickerByKey(latest.sticker_key);
    if (!definition) return;
    const personal = pack === "personal";
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
    <div className="school-sticker-picker__heading"><div><strong id="calendar-sticker-title">날짜 스티커 붙이기</strong><span>날짜와 스티커를 고른 뒤 저장하면 캘린더에 바로 표시됩니다.</span></div></div>
    <div aria-label="날짜 스티커 팩" className="calendar-sticker-tabs" role="tablist">
      {packs.map(([value, label]) => <button aria-controls="calendar-sticker-panel" aria-selected={pack === value} id={`calendar-sticker-${value}-tab`} key={value} onClick={() => selectPack(value)} ref={pack === value ? activeTabRef : undefined} role="tab" type="button">{label}</button>)}
    </div>
    <form action={attachAction} aria-labelledby={`calendar-sticker-${pack}-tab`} className="school-sticker-picker__form" id="calendar-sticker-panel" role="tabpanel">
      <div className="form-grid"><label className="field"><span className="field-label">시작일</span><CalendarDateInput defaultValue={today} name="stickerDate" onValueChange={setSelectedDate} required /></label><label className="field"><span className="field-label">종료일</span><CalendarDateInput min={selectedDate} name="endDate" /></label></div>
      <label className="calendar-sticker-search"><span className="sr-only">스티커 검색</span><Search aria-hidden="true" size={17} /><input onChange={(event) => { setQuery(event.target.value); setSelectedKey(null); }} placeholder="이름, 키워드, 카테고리 검색" type="search" value={query} />{query && <button aria-label="스티커 검색어 지우기" onClick={() => { setQuery(""); setSelectedKey(null); }} type="button"><X aria-hidden="true" size={16} /></button>}</label>
      {groups.length > 0 && <div aria-label={`${packs.find(([value]) => value === pack)?.[1] ?? "스티커"} 카테고리`} className="calendar-sticker-groups" role="group">{groups.map(([value, label]) => <button aria-pressed={group === value} key={value} onClick={() => { setGroup(value); setSelectedKey(null); }} type="button">{label}</button>)}</div>}
      <input name="stickerKey" type="hidden" value={selectedKey ?? ""} />
      <p aria-live="polite" className="sr-only">{visibleCatalog.length}개의 스티커가 표시됩니다.</p>
      {visibleCatalog.length > 0 ? <div className="school-sticker-grid">{visibleCatalog.map((item) => <button aria-label={`${dateLabel(selectedDate)} ${item.label} 스티커 선택`} aria-pressed={selectedKey === item.key} className={selectedKey === item.key ? "is-selected" : undefined} key={item.key} onClick={() => setSelectedKey(item.key)} type="button"><CalendarDateSticker stickerKey={item.key} />{selectedKey === item.key && <Check aria-hidden="true" className="school-sticker-grid__check" size={16} />}</button>)}</div> : <p className="calendar-sticker-empty">검색 결과가 없습니다.</p>}
      <button className="button school-sticker-picker__save" disabled={!selectedKey || attachPending} type="submit">{attachPending ? "저장 중…" : selectedKey ? `${calendarStickerByKey(selectedKey)?.label ?? "선택한"} 스티커 저장` : "스티커를 선택해 주세요"}</button>
    </form>
    {selected.map((item) => <div className="school-sticker-picker__selected" key={item.id}><CalendarDateSticker stickerKey={item.sticker_key} /><div><strong>{item.label}</strong><small>{item.sticker_date}{item.end_date ? ` ~ ${item.end_date}` : ""}</small></div><form action={removeAction}><input name="stickerId" type="hidden" value={item.id} /><button className="text-action" disabled={removePending} type="submit">제거</button></form>{item.id === latest?.id && <button className="button button--secondary" onClick={openLinkedEvent} ref={eventButtonRef} type="button">{pack === "personal" ? "개인 일정도 만들기" : "종일 학교 일정도 만들기"}</button>}</div>)}
    {(attachState.message || removeState.message) && <p aria-live="polite" className={(attachState.status === "error" || removeState.status === "error") ? "form-message form-message--error" : "form-message"}>{attachState.message ?? removeState.message}</p>}
  </section>;
}
