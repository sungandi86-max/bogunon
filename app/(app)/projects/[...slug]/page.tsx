import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectBudget } from "@/components/projects/project-budget";
import { ProjectChecklist } from "@/components/projects/project-checklist";
import { ProjectWorkspaceShell } from "@/components/projects/project-detail-workspace";
import { ProjectReservations } from "@/components/projects/project-reservations";
import { ProjectSchedule } from "@/components/projects/project-schedule";
import { ProjectWorkspaceHeader } from "@/components/projects/project-workspace-header";
import { ProjectWorkspaceOverview } from "@/components/projects/project-workspace-overview";
import { listProjectChecklistItems } from "@/lib/projects/checklist-repository";
import {
  listProjectBudget,
  listProjectExpenses,
} from "@/lib/projects/budget-repository";
import { listProjectReservations } from "@/lib/projects/reservation-repository";
import { getProject, listProjectEvents } from "@/lib/projects/repository";
import { todayInSeoul } from "@/lib/work-items/date";

export default async function ProjectDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string[] }>;
}) {
  const { slug } = await params;
  const id = slug[0];
  if (!id || slug.length !== 1) notFound();
  const [project, events, checklistItems, reservations, budget, expenses] = await Promise.all([
    getProject(id),
    listProjectEvents(id),
    listProjectChecklistItems(id),
    listProjectReservations(id),
    listProjectBudget(id),
    listProjectExpenses(id),
  ]);
  if (!project) notFound();
  const today = todayInSeoul();

  return (
    <main className="page-canvas project-detail-page">
      <Link className="text-action project-detail-page__back" href="/projects"><ArrowLeft aria-hidden="true" size={16} />프로젝트 목록</Link>
      <ProjectWorkspaceHeader
        checklistCount={checklistItems.length}
        eventCount={events.length}
        expenseCount={expenses.length}
        project={project}
        reservationCount={reservations.length}
      />
      <ProjectWorkspaceShell
        budget={(
          <ProjectBudget
            budget={budget}
            expenses={expenses}
            projectId={project.id}
            reservations={reservations}
            today={today}
          />
        )}
        checklist={(
          <ProjectChecklist
            initialItems={checklistItems}
            projectId={project.id}
            today={today}
          />
        )}
        overview={(
          <ProjectWorkspaceOverview
            budget={budget}
            checklistItems={checklistItems}
            events={events}
            expenses={expenses}
            reservations={reservations}
            today={today}
          />
        )}
        reservations={(
          <ProjectReservations
            expenses={expenses}
            projectId={project.id}
            reservations={reservations}
          />
        )}
        schedule={<ProjectSchedule events={events} />}
      />
    </main>
  );
}
