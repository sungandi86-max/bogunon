"use client";

import {
  Activity,
  BookOpen,
  CalendarDays,
  Car,
  FileText,
  Hotel,
  MapPin,
  Plane,
  Plus,
  Search,
  Trophy,
  Users,
  MapPinned,
} from "lucide-react";
import Link from "next/link";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { Button } from "@/components/ui/button";
import { projectEventTemplate, projectTypeForIcon } from "@/lib/projects/domain";
import {
  scheduleRecommendationsFor,
  type WorkspaceRecommendationIcon,
} from "@/lib/projects/workspace-presets";
import type { EventRow, ProjectRow } from "@/types/database";

function eventTime(event: EventRow): string {
  if (event.is_all_day) return "종일";
  const start = event.start_time?.slice(0, 5) ?? "";
  return event.end_time ? `${start} ~ ${event.end_time.slice(0, 5)}` : start;
}

function RecommendationIcon({ icon }: { readonly icon: WorkspaceRecommendationIcon }) {
  const props = { "aria-hidden": true as const, size: 17 };
  switch (icon) {
    case "activity": return <Activity {...props} />;
    case "book": return <BookOpen {...props} />;
    case "calendar": return <CalendarDays {...props} />;
    case "car": return <Car {...props} />;
    case "file": return <FileText {...props} />;
    case "hotel": return <Hotel {...props} />;
    case "plane": return <Plane {...props} />;
    case "search": return <Search {...props} />;
    case "trophy": return <Trophy {...props} />;
    case "users": return <Users {...props} />;
  }
}

export function ProjectSchedule({
  events,
  project,
}: {
  readonly events: readonly EventRow[];
  readonly project: ProjectRow;
}) {
  const { openCreate } = useAppShellCreate();
  const recommendations = scheduleRecommendationsFor(projectTypeForIcon(project.icon));

  function openProjectEvent(trigger: HTMLButtonElement, title = ""): void {
    openCreate(trigger, "event", {
      ...projectEventTemplate(project.id, project.name),
      title,
    });
  }

  return (
    <section aria-labelledby="project-events-title" className="project-event-section">
      <div className="section-title-row">
        <div>
          <h2 id="project-events-title">프로젝트 일정</h2>
          <p>일정 생성·수정 화면에서 이 프로젝트를 선택한 항목입니다.</p>
        </div>
        {events.length > 0 && (
          <Button onClick={(event) => openProjectEvent(event.currentTarget)}>
            <Plus aria-hidden="true" size={17} />일정 추가
          </Button>
        )}
      </div>
      {events.length ? (
        <div className="project-event-list">
          {events.map((event) => (
            <div className="project-event-row" key={event.id}>
              <Link className="project-event-row__main" href={`/calendar?date=${event.start_date}&highlight=${event.id}`}>
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
              {event.location && <Link aria-label={`${event.title} 지도에 장소 추가`} className="project-event-row__map" href={`/projects/${project.id}?placeEvent=${event.id}#map`}><MapPinned aria-hidden="true" size={16} />지도에 장소 추가</Link>}
            </div>
          ))}
        </div>
      ) : (
        <div className="workspace-action-empty">
          <div className="workspace-action-empty__intro">
            <span className="workspace-action-empty__icon"><CalendarDays aria-hidden="true" size={22} /></span>
            <div>
              <h3>아직 일정이 없습니다.</h3>
              <p>이 프로젝트의 첫 일정을 만들어보세요.</p>
            </div>
          </div>
          <Button onClick={(event) => openProjectEvent(event.currentTarget)}>
            <Plus aria-hidden="true" size={17} />일정 추가
          </Button>
          {recommendations.length > 0 && (
            <div className="workspace-recommendations">
              <span>추천 일정</span>
              <div className="workspace-recommendations__grid">
                {recommendations.map((recommendation) => (
                  <button
                    key={recommendation.title}
                    onClick={(event) => openProjectEvent(event.currentTarget, recommendation.title)}
                    type="button"
                  >
                    <RecommendationIcon icon={recommendation.icon} />
                    <span>{recommendation.title}</span>
                    <Plus aria-hidden="true" size={14} />
                  </button>
                ))}
              </div>
              <p>추천을 선택하면 제목만 채워집니다. 저장 전에는 일정이 생성되지 않습니다.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
