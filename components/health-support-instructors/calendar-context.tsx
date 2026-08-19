"use client";

import { CalendarDays, Clock3 } from "lucide-react";

import {
  appendCalendarContextToDraft,
  calendarEventsForWorkDate,
  timeDraftFromWorkLog,
  type HealthSupportTimeDraft,
} from "@/lib/health-support-instructors/calendar-context";
import type { HealthSupportWorkLog } from "@/lib/health-support-instructors/repository";
import type { EventRow } from "@/types/database";

interface HealthSupportCalendarContextProps {
  readonly events: readonly EventRow[];
  readonly note: string;
  readonly onNoteChange: (note: string) => void;
  readonly onTimeChange: (draft: HealthSupportTimeDraft) => void;
  readonly recentLogs: readonly HealthSupportWorkLog[];
  readonly selectedDate: string;
}

function displayTime(event: EventRow): string | null {
  if (event.is_all_day) return "종일";
  if (!event.start_time) return null;
  const startTime = event.start_time.slice(0, 5);
  const endTime = event.end_time?.slice(0, 5);
  return endTime ? `${startTime}–${endTime}` : startTime;
}

export function HealthSupportCalendarContext({ events, note, onNoteChange, onTimeChange, recentLogs, selectedDate }: HealthSupportCalendarContextProps) {
  const matchingEvents = calendarEventsForWorkDate(events, selectedDate);
  const recentLog = recentLogs[0];

  return <aside aria-label="선택한 근무일의 일정 참고" className="health-support-calendar-context">
    <div className="health-support-calendar-context__heading"><CalendarDays aria-hidden="true" size={16} /><h4>일정 참고</h4><span>{selectedDate}</span></div>
    {matchingEvents.length === 0 ? <p>학교 일정이 없습니다.</p> : <ul>
      {matchingEvents.map((event) => {
        const time = displayTime(event);
        return <li key={event.id}><div><strong>{event.title}</strong>{time && <span>{time}</span>}</div><button className="button button--ghost" onClick={() => onNoteChange(appendCalendarContextToDraft(note, event))} type="button">비고에 추가</button></li>;
      })}
    </ul>}
    {recentLog && <button className="button button--secondary health-support-calendar-context__reuse" onClick={() => onTimeChange(timeDraftFromWorkLog(recentLog))} type="button"><Clock3 aria-hidden="true" size={14} />최근 시간 재사용</button>}
  </aside>;
}
