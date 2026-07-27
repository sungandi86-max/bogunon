import { CalendarRange } from "lucide-react";

import { ProjectIcon } from "@/components/projects/project-icon";
import { PROJECT_COLORS } from "@/lib/projects/domain";
import type { ProjectRow } from "@/types/database";

type ProjectWorkspaceHeaderProps = {
  readonly checklistCount: number;
  readonly eventCount: number;
  readonly expenseCount: number;
  readonly project: ProjectRow;
  readonly reservationCount: number;
};

function projectPeriod(project: ProjectRow): string {
  if (!project.start_date && !project.end_date) return "기간 미정";
  if (project.start_date && project.end_date) return `${project.start_date} ~ ${project.end_date}`;
  return project.start_date ? `${project.start_date}부터` : `${project.end_date}까지`;
}

export function ProjectWorkspaceHeader({
  checklistCount,
  eventCount,
  expenseCount,
  project,
  reservationCount,
}: ProjectWorkspaceHeaderProps) {
  const colorLabel = PROJECT_COLORS.find(({ value }) => value === project.color)?.label ?? "민트";
  const stats = [
    { label: "일정", value: eventCount },
    { label: "체크리스트", value: checklistCount },
    { label: "예약", value: reservationCount },
    { label: "지출", value: expenseCount },
  ];

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
