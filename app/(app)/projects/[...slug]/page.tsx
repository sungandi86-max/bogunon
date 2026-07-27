import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ProjectBudget } from "@/components/projects/project-budget";
import { ProjectChecklist } from "@/components/projects/project-checklist";
import { ProjectIcon } from "@/components/projects/project-icon";
import { ProjectReservations } from "@/components/projects/project-reservations";
import { listProjectChecklistItems } from "@/lib/projects/checklist-repository";
import {
  listProjectBudget,
  listProjectExpenses,
} from "@/lib/projects/budget-repository";
import { listProjectReservations } from "@/lib/projects/reservation-repository";
import { getProject, listProjectEvents } from "@/lib/projects/repository";
import { todayInSeoul } from "@/lib/work-items/date";

function eventTime(isAllDay: boolean, startTime: string | null, endTime: string | null): string {
  if (isAllDay) return "종일";
  const start = startTime?.slice(0, 5) ?? "";
  return endTime ? `${start} ~ ${endTime.slice(0, 5)}` : start;
}

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

  return (
    <main className="page-canvas project-detail-page">
      <Link className="text-action project-detail-page__back" href="/projects"><ArrowLeft aria-hidden="true" size={16} />프로젝트 목록</Link>
      <PageHeader
        description={project.description ?? "연결된 일정을 시간순으로 확인합니다."}
        eyebrow={project.start_date || project.end_date ? `${project.start_date ?? "시작일 미정"} ~ ${project.end_date ?? "종료일 미정"}` : "기간 미정"}
        title={project.name}
      />
      <section className={`project-detail-summary project-card--${project.color}`}>
        <span><ProjectIcon icon={project.icon} size={22} /></span>
        <div><strong>연결된 일정</strong><p>{events.length}개</p></div>
      </section>
      <ProjectChecklist
        initialItems={checklistItems}
        projectId={project.id}
        today={todayInSeoul()}
      />
      <ProjectReservations
        expenses={expenses}
        projectId={project.id}
        reservations={reservations}
      />
      <ProjectBudget
        budget={budget}
        expenses={expenses}
        projectId={project.id}
        reservations={reservations}
        today={todayInSeoul()}
      />
      <section aria-labelledby="project-events-title" className="project-event-section">
        <div className="section-title-row"><div><h2 id="project-events-title">프로젝트 일정</h2><p>일정 생성·수정 화면에서 이 프로젝트를 선택한 항목입니다.</p></div></div>
        {events.length ? <div className="project-event-list">{events.map((event) => (
          <Link className="project-event-row" href={`/calendar?date=${event.start_date}&highlight=${event.id}`} key={event.id}>
            <span className={`project-event-row__date event-color--${event.color_key ?? "mint"}`}><strong>{event.start_date.slice(5).replace("-", ".")}</strong><small>{eventTime(event.is_all_day, event.start_time, event.end_time)}</small></span>
            <span><strong>{event.title}</strong>{event.location && <small><MapPin aria-hidden="true" size={13} />{event.location}</small>}</span>
            <CalendarDays aria-hidden="true" size={17} />
          </Link>
        ))}</div> : <div className="empty-state"><CalendarDays aria-hidden="true" /><div><h3>연결된 일정이 없습니다.</h3><p>일정을 만들거나 수정할 때 이 프로젝트를 선택하세요.</p></div></div>}
      </section>
    </main>
  );
}
