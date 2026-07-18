"use client";

import { CalendarDays } from "lucide-react";

import { useCalendarPreferences } from "@/components/calendar/calendar-preferences-provider";
import type { CalendarWeekStart } from "@/lib/calendar/preferences";

const options = [["sunday", "일요일"], ["monday", "월요일"]] as const satisfies readonly (readonly [CalendarWeekStart, string])[];

export function CalendarPreferencesCard() {
  const { setWeekStart, weekStart } = useCalendarPreferences();

  return <section className="settings-card calendar-preferences-card" aria-labelledby="calendar-preferences-title">
    <div className="settings-card__heading"><CalendarDays aria-hidden="true" size={20} /><div><h2 id="calendar-preferences-title">캘린더</h2><p>모든 달력의 한 주 시작 위치를 정합니다.</p></div></div>
    <fieldset className="calendar-week-start"><legend>캘린더 시작 요일</legend>{options.map(([value, label]) => <label key={value}><input checked={weekStart === value} name="calendarWeekStart" onChange={() => setWeekStart(value)} type="radio" value={value} /><span>{label}</span></label>)}</fieldset>
    <p className="calendar-preferences-card__note" aria-live="polite">현재 {weekStart === "sunday" ? "일요일" : "월요일"}부터 표시합니다.</p>
  </section>;
}
