import { CalendarDays, CheckCircle2, CircleDollarSign, TicketCheck } from "lucide-react";
import Link from "next/link";

import { ProjectWorkspaceEmptyActions } from "@/components/projects/project-workspace-empty-actions";
import { expenseSummary, formatWon } from "@/lib/projects/budget";
import type {
  EventRow,
  ProjectBudgetRow,
  ProjectChecklistItemRow,
  ProjectExpenseRow,
  ProjectRow,
  ProjectReservationRow,
} from "@/types/database";

type ProjectWorkspaceOverviewProps = {
  readonly budget: ProjectBudgetRow | null;
  readonly checklistItems: readonly ProjectChecklistItemRow[];
  readonly events: readonly EventRow[];
  readonly expenses: readonly ProjectExpenseRow[];
  readonly project: ProjectRow;
  readonly reservations: readonly ProjectReservationRow[];
  readonly today: string;
};

function compactDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

function eventTime(event: EventRow): string {
  if (event.is_all_day) return "종일";
  return event.start_time?.slice(0, 5) ?? "시간 미정";
}

export function ProjectWorkspaceOverview({
  budget,
  checklistItems,
  events,
  expenses,
  project,
  reservations,
  today,
}: ProjectWorkspaceOverviewProps) {
  const todayEvents = events.filter((event) => event.start_date <= today && event.end_date >= today);
  const completedCount = checklistItems.filter((item) => item.is_completed).length;
  const nextReservation = reservations.find((reservation) => reservation.reservation_date >= today);
  const summary = expenseSummary(budget?.budget_amount ?? null, expenses);
  const isEmpty = !events.length
    && !checklistItems.length
    && !reservations.length
    && !expenses.length
    && !budget;

  return (
    <section aria-labelledby="project-overview-title" className="project-workspace-overview">
      <h2 id="project-overview-title">프로젝트 개요</h2>
      {isEmpty && <ProjectWorkspaceEmptyActions project={project} />}
      <article className="project-overview-block">
        <div className="project-overview-block__heading">
          <CalendarDays aria-hidden="true" size={18} />
          <h3>오늘 일정</h3>
        </div>
        {todayEvents.length ? (
          <div className="project-overview-events">
            {todayEvents.map((event) => (
              <Link href={`/calendar?date=${today}&highlight=${event.id}`} key={event.id}>
                <span>{eventTime(event)}</span>
                <strong>{event.title}</strong>
              </Link>
            ))}
          </div>
        ) : <p className="project-overview-block__empty">오늘 일정이 없습니다.</p>}
      </article>

      <article className="project-overview-block">
        <div className="project-overview-block__heading">
          <CheckCircle2 aria-hidden="true" size={18} />
          <h3>체크리스트 진행률</h3>
        </div>
        <strong className="project-overview-progress__value">{completedCount} / {checklistItems.length} 완료</strong>
        <progress
          aria-label={`체크리스트 ${completedCount}/${checklistItems.length} 완료`}
          className="project-overview-progress"
          max={Math.max(checklistItems.length, 1)}
          value={completedCount}
        />
      </article>

      <article className="project-overview-block">
        <div className="project-overview-block__heading">
          <TicketCheck aria-hidden="true" size={18} />
          <h3>예약 요약</h3>
        </div>
        <strong>{reservations.length}건</strong>
        {nextReservation ? (
          <div className="project-overview-next">
            <span>다음 예약 · {compactDate(nextReservation.reservation_date)}</span>
            <strong>{nextReservation.title}</strong>
          </div>
        ) : <p className="project-overview-block__empty">예정된 예약이 없습니다.</p>}
      </article>

      <article className="project-overview-block">
        <div className="project-overview-block__heading">
          <CircleDollarSign aria-hidden="true" size={18} />
          <h3>예산 요약</h3>
        </div>
        <dl className="project-overview-budget">
          <div><dt>예산</dt><dd>{summary.budgetAmount === null ? "미설정" : formatWon(summary.budgetAmount)}</dd></div>
          <div><dt>사용</dt><dd>{formatWon(summary.expectedAmount)}</dd></div>
          <div>
            <dt>{summary.remainingAmount !== null && summary.remainingAmount < 0 ? "초과" : "남음"}</dt>
            <dd>{summary.remainingAmount === null ? "계산 전" : formatWon(Math.abs(summary.remainingAmount))}</dd>
          </div>
        </dl>
      </article>
    </section>
  );
}
