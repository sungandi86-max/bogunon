"use client";

import { useState } from "react";

import { useCalendarPreferences } from "@/components/calendar/calendar-preferences-provider";
import { calendarWeekRange, weekdayLabels } from "@/lib/calendar/preferences";
import { addCalendarDays } from "@/lib/work-items/date";
import type { EventRow } from "@/types/database";

export function MobileWeekStrip({ events, today }: { readonly events: EventRow[]; readonly today: string }) {
  const { weekStart } = useCalendarPreferences();
  const range = calendarWeekRange(today, weekStart);
  const dates = Array.from({ length: 7 }, (_, index) => addCalendarDays(range.first, index));
  const weekdays = weekdayLabels(weekStart);
  const [selected, setSelected] = useState(today);
  return <div className="mobile-week-strip" aria-label="주간 날짜 선택">{dates.map((date, index) => {
    const value = new Date(`${date}T00:00:00Z`);
    const hasEvent = events.some((event) => event.start_date <= date && event.end_date >= date);
    return <button aria-pressed={selected === date} className={`week-strip-day${selected === date ? " is-selected" : ""}${date === today ? " is-today" : ""}`} key={date} onClick={() => setSelected(date)} type="button"><small>{weekdays[index]}</small><strong>{value.getUTCDate()}</strong><span className="week-strip-markers" aria-hidden="true">{hasEvent && <span className="marker" />}</span></button>;
  })}</div>;
}
