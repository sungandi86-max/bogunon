"use client";

import { CalendarClock } from "lucide-react";

import type { EventRow } from "@/types/database";

export function MobileDailySchedule({ today, upcomingEvents }: { readonly today: string; readonly upcomingEvents: readonly EventRow[] }) {
  const todayEvents = upcomingEvents
    .filter((event) => event.start_date <= today && event.end_date >= today)
    .sort((left, right) => (left.start_time ?? "23:59").localeCompare(right.start_time ?? "23:59"))
    .slice(0, 5);

  return <section className="mobile-daily-compact" aria-label="오늘 일정">
    {todayEvents.length > 0 ? todayEvents.map((event) => <div className="mobile-daily-compact__row" key={event.id}>
      <CalendarClock aria-hidden="true" size={17} />
      <span className="mobile-daily-compact__label">{event.is_all_day ? "종일" : event.start_time?.slice(0, 5) ?? "일정"}</span>
      <strong>{event.title}</strong>
    </div>) : <p className="mobile-daily-compact__empty">오늘 등록된 일정이 없습니다.</p>}
  </section>;
}
