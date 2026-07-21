import { CalendarDays } from "lucide-react";
import Link from "next/link";

import type { Area, EventRow } from "@/types/database";

const areaLabels: Record<Area, string> = {
  healthWork: "업무",
  schoolSchedule: "학교",
  exercise: "운동",
  personal: "개인",
  project: "프로젝트",
};

export function TodayScheduleCard({ events, today }: { readonly events: readonly EventRow[]; readonly today: string }) {
  return <section className="rail-module school-daily-card" aria-labelledby="schedule-title">
    <div className="rail-heading"><div><span className="rail-kicker">{today.replaceAll("-", ". ")}</span><h2 id="schedule-title">오늘 일정</h2></div><strong>{events.length}</strong></div>
    {events.length > 0 ? <div className="daily-schedule-list">{events.slice(0, 3).map((event) => <Link className="daily-schedule-row" href={`/calendar?date=${today}&highlight=event:${event.id}`} key={event.id}><time>{event.is_all_day ? "종일" : event.start_time?.slice(0, 5) ?? "일정"}</time><span><small>{areaLabels[event.area]}</small><strong>{event.title}</strong></span><CalendarDays aria-hidden="true" size={15} /></Link>)}</div> : <p className="rail-empty">오늘 일정이 없습니다.</p>}
    {events.length > 3 && <Link className="rail-card-link" href={`/calendar?date=${today}`}>전체 일정 보기</Link>}
  </section>;
}
