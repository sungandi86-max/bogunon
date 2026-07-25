"use client";

import { CalendarClock, Dumbbell, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import { resolveEventType } from "@/lib/work-items/event-types";
import type { CalendarStickerRow, EventRow } from "@/types/database";

const selectedDateLabel = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "long",
});

function labelForDate(date: string): string {
  return selectedDateLabel.format(new Date(`${date}T00:00:00+09:00`));
}

export function BriefingMonthOverview({ events, month, stickers, today }: { readonly events: readonly EventRow[]; readonly month: string; readonly stickers: readonly CalendarStickerRow[]; readonly today: string }) {
  const initialDate = today.startsWith(`${month}-`) ? today : `${month}-01`;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const selectedEvents = events
    .filter((event) => event.start_date <= selectedDate && event.end_date >= selectedDate)
    .sort((left, right) => (left.start_time ?? "23:59").localeCompare(right.start_time ?? "23:59"));
  const selectedStickers = stickers.filter((sticker) => sticker.sticker_date <= selectedDate && (sticker.end_date ?? sticker.sticker_date) >= selectedDate);
  const dateLabel = labelForDate(selectedDate);

  return <section className="month-overview" aria-labelledby="month-overview-title">
    <div className="section-heading month-overview__heading"><div><p>월간 통합 캘린더</p><h2 id="month-overview-title">{month.replace("-", "년 ")}월</h2></div></div>
    <FullMonthCalendar events={[...events]} month={month} onSelectDate={setSelectedDate} schoolStickers={[...stickers]} selectedDate={selectedDate} today={today} />
    <section aria-label={`${dateLabel} 일정`} className="mobile-selected-date-list">
      <header><strong>{dateLabel}</strong><span>{selectedEvents.length + selectedStickers.length}개</span></header>
      {selectedEvents.length === 0 && selectedStickers.length === 0
        ? <p>등록된 일정이 없어요.</p>
        : <div>{selectedEvents.map((event) => {
          const type = resolveEventType(event);
          const Icon = type === "workout" ? Dumbbell : type === "tournament" ? Trophy : CalendarClock;
          return <Link className={`mobile-selected-date-list__item mobile-selected-date-list__item--${type}`} href={`/calendar?date=${selectedDate}&highlight=${encodeURIComponent(`event:${event.id}`)}`} key={event.id}>
            <Icon aria-hidden="true" size={17} />
            <span>{event.is_all_day ? "종일" : event.start_time?.slice(0, 5) ?? "일정"}</span>
            <strong>{event.title}</strong>
          </Link>;
        })}{selectedStickers.map((sticker) => {
          const pack = calendarStickerByKey(sticker.sticker_key)?.pack ?? "school";
          return <Link className={`mobile-selected-date-list__item mobile-selected-date-list__item--${pack}`} href={`/calendar?date=${selectedDate}&highlight=${encodeURIComponent(`sticker:${sticker.id}`)}`} key={sticker.id}>
            <span aria-hidden="true" className="mobile-selected-date-list__dot" />
            <span>종일</span>
            <strong>{sticker.label}</strong>
          </Link>;
        })}</div>}
    </section>
  </section>;
}
