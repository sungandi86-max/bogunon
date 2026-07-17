"use client";

import { useState } from "react";

import type { EventRow } from "@/types/database";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

export function MobileWeekStrip({ events, today }: { readonly events: EventRow[]; readonly today: string }) {
  const todayDate = new Date(`${today}T00:00:00Z`);
  const mondayOffset = (todayDate.getUTCDay() + 6) % 7;
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayDate);
    date.setUTCDate(todayDate.getUTCDate() - mondayOffset + index);
    return date.toISOString().slice(0, 10);
  });
  const [selected, setSelected] = useState(today);
  return <div className="mobile-week-strip" aria-label="주간 날짜 선택">{dates.map((date) => {
    const value = new Date(`${date}T00:00:00Z`);
    const hasEvent = events.some((event) => event.start_date <= date && event.end_date >= date);
    return <button aria-pressed={selected === date} className={`week-strip-day${selected === date ? " is-selected" : ""}${date === today ? " is-today" : ""}`} key={date} onClick={() => setSelected(date)} type="button"><small>{weekdays[value.getUTCDay()]}</small><strong>{value.getUTCDate()}</strong><span className="week-strip-markers" aria-hidden="true">{hasEvent && <span className="marker" />}</span></button>;
  })}</div>;
}
