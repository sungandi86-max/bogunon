import { CalendarRange } from "lucide-react";

import { ProjectIcon } from "@/components/projects/project-icon";
import { PROJECT_COLORS, projectTypeForIcon } from "@/lib/projects/domain";
import type { EventRow, ProjectRow } from "@/types/database";

type ProjectWorkspaceHeaderProps = {
  readonly checklistCount: number;
  readonly eventCount: number;
  readonly events: readonly EventRow[];
  readonly expenseCount: number;
  readonly project: ProjectRow;
  readonly reservationCount: number;
  readonly today: string;
};

function projectPeriod(project: ProjectRow): string {
  if (!project.start_date && !project.end_date) return "기간 미정";
  if (project.start_date && project.end_date) return `${project.start_date} ~ ${project.end_date}`;
  return project.start_date ? `${project.start_date}부터` : `${project.end_date}까지`;
}

function compactDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function ProjectWorkspaceHeader({
  checklistCount,
  eventCount,
  events,
  expenseCount,
  project,
  reservationCount,
  today,
}: ProjectWorkspaceHeaderProps) {
  const colorLabel = PROJECT_COLORS.find(({ value }) => value === project.color)?.label ?? "민트";
  const stats = [
    { label: "일정", value: eventCount },
    { label: "체크리스트", value: checklistCount },
    { label: "예약", value: reservationCount },
    { label: "지출", value: expenseCount },
  ];
  const projectType = projectTypeForIcon(project.icon);
  const upcomingEvents = [...events]
    .filter((event) => event.end_date >= today)
    .sort((left, right) => left.start_date.localeCompare(right.start_date));
  const milestoneEvent = projectType === "workout"
    ? upcomingEvents.find((event) => event.event_type === "tournament")
    : upcomingEvents[0];
  const milestoneLabel = projectType === "school"
    ? "다음 마감 일정"
    : projectType === "publication"
      ? "원고 마감"
      : projectType === "workout"
        ? "다음 대회"
        : "다음 일정";

  return (
    <header className={`project-workspace-header project-card--${project.color}`}>
      <div className="project-workspace-header__identity">
        <span className="project-workspace-header__icon"><ProjectIcon icon={project.icon} size={24} /></span>
        <div>
          <div className="project-workspace-header__title-row">
            <h1>{project.name}</h1>
            <span className={`project-workspace-header__color project-workspace-header__color--${project.color}`}>
              <span aria-hidden="true" />
              {colorLabel}
            </span>
          </div>
          <p className="project-workspace-header__period">
            <CalendarRange aria-hidden="true" size={15} />
            {projectPeriod(project)}
          </p>
          {project.description && <p className="project-workspace-header__description">{project.description}</p>}
          <div className="project-workspace-header__milestone">
            {projectType === "travel" ? (
              project.start_date || project.end_date ? (
                <>
                  <strong>
                    {project.start_date && project.end_date && today >= project.start_date && today <= project.end_date
                      ? "여행 중"
                      : project.start_date && daysBetween(today, project.start_date) >= 0
                        ? `D-${daysBetween(today, project.start_date)}`
                        : "여행 완료"}
                  </strong>
                  <span><small>출발일</small><b>{project.start_date ? compactDate(project.start_date) : "미정"}</b></span>
                  <span><small>귀가일</small><b>{project.end_date ? compactDate(project.end_date) : "미정"}</b></span>
                </>
              ) : (
                <>
                  <strong>여행 일정</strong>
                  <span>일정을 추가하면 표시됩니다.</span>
                </>
              )
            ) : (
              <>
                <strong>{milestoneLabel}</strong>
                {milestoneEvent
                  ? <span>{compactDate(milestoneEvent.start_date)} · {milestoneEvent.title}</span>
                  : <span>일정을 추가하면 표시됩니다.</span>}
              </>
            )}
          </div>
        </div>
      </div>
      <dl aria-label="프로젝트 통계" className="project-workspace-header__stats">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
