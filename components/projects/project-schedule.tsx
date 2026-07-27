import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

import type { EventRow } from "@/types/database";

function eventTime(event: EventRow): string {
  if (event.is_all_day) return "종일";
  const start = event.start_time?.slice(0, 5) ?? "";
  return event.end_time ? `${start} ~ ${event.end_time.slice(0, 5)}` : start;
}

export function ProjectSchedule({ events }: { readonly events: readonly EventRow[] }) {
  return (
    <section aria-labelledby="project-events-title" className="project-event-section">
      <div className="section-title-row">
        <div>
          <h2 id="project-events-title">프로젝트 일정</h2>
          <p>일정 생성·수정 화면에서 이 프로젝트를 선택한 항목입니다.</p>
        </div>
      </div>
      {events.length ? (
        <div className="project-event-list">
          {events.map((event) => (
            <Link className="project-event-row" href={`/calendar?date=${event.start_date}&highlight=${event.id}`} key={event.id}>
              <span className={`project-event-row__date event-color--${event.color_key ?? "mint"}`}>
                <strong>{event.start_date.slice(5).replace("-", ".")}</strong>
                <small>{eventTime(event)}</small>
              </span>
              <span>
                <strong>{event.title}</strong>
                {event.location && <small><MapPin aria-hidden="true" size={13} />{event.location}</small>}
              </span>
              <CalendarDays aria-hidden="true" size={17} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CalendarDays aria-hidden="true" />
          <div><h3>연결된 일정이 없습니다.</h3><p>일정을 만들거나 수정할 때 이 프로젝트를 선택하세요.</p></div>
        </div>
      )}
    </section>
  );
}
