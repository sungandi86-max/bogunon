"use client";

import { CalendarDays, MapPin, Plus } from "lucide-react";
import Link from "next/link";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { Button } from "@/components/ui/button";
import { projectEventTemplate } from "@/lib/projects/domain";
import type { EventRow, ProjectRow } from "@/types/database";

function eventTime(event: EventRow): string {
  if (event.is_all_day) return "종일";
  const start = event.start_time?.slice(0, 5) ?? "";
  return event.end_time ? `${start} ~ ${event.end_time.slice(0, 5)}` : start;
}

export function ProjectSchedule({
  events,
  project,
}: {
  readonly events: readonly EventRow[];
  readonly project: ProjectRow;
}) {
  const { openCreate } = useAppShellCreate();

  return (
    <section aria-labelledby="project-events-title" className="project-event-section">
      <div className="section-title-row">
        <div>
          <h2 id="project-events-title">프로젝트 일정</h2>
          <p>일정 생성·수정 화면에서 이 프로젝트를 선택한 항목입니다.</p>
        </div>
        <Button onClick={(event) => openCreate(event.currentTarget, "event", projectEventTemplate(project.id, project.name))}>
          <Plus aria-hidden="true" size={17} />일정 추가
        </Button>
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
          <div><h3>아직 연결된 일정이 없습니다.</h3><p>이 Workspace에서 일정을 추가하면 프로젝트가 자동으로 선택됩니다.</p></div>
        </div>
      )}
    </section>
  );
}
