import { Activity, CalendarDays, CheckCircle2, CircleDollarSign, TicketCheck } from "lucide-react";
import Link from "next/link";

import { ProjectWorkspaceEmptyActions } from "@/components/projects/project-workspace-empty-actions";
import { expenseSummary, formatWon } from "@/lib/projects/budget";
import {
  formatReservationPeriod,
  reservationEndDate,
} from "@/lib/projects/reservations";
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

type RecentActivity = {
  readonly id: string;
  readonly label: string;
  readonly timestamp: string;
  readonly title: string;
};

export function ProjectWorkspaceOverview({
  budget,
  checklistItems,
  events,
  expenses,
  project,
  reservations,
  today,
}: ProjectWorkspaceOverviewProps) {
  const nextEvent = [...events]
    .filter((event) => event.end_date >= today)
    .sort((left, right) => (
      `${left.start_date}T${left.start_time ?? "00:00"}`.localeCompare(`${right.start_date}T${right.start_time ?? "00:00"}`)
    ))[0];
  const completedCount = checklistItems.filter((item) => item.is_completed).length;
  const nextReservation = reservations.find((reservation) => reservationEndDate(reservation) >= today);
  const summary = expenseSummary(budget?.budget_amount ?? null, expenses);
  const recentActivities: readonly RecentActivity[] = [
    ...events.map((event) => ({ id: event.id, label: "일정", timestamp: event.updated_at, title: event.title })),
    ...checklistItems.map((item) => ({ id: item.id, label: "체크리스트", timestamp: item.updated_at, title: item.title })),
    ...reservations.map((reservation) => ({
      id: reservation.id,
      label: "예약",
      timestamp: reservation.updated_at,
      title: reservation.title,
    })),
    ...expenses.map((expense) => ({ id: expense.id, label: "지출", timestamp: expense.updated_at, title: expense.title })),
  ]
    .filter((activity) => activity.timestamp)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 3);
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
          <h3>다음 일정</h3>
        </div>
        {nextEvent ? (
          <div className="project-overview-events">
            <Link href={`/calendar?date=${nextEvent.start_date}&highlight=${nextEvent.id}`}>
              <span>{compactDate(nextEvent.start_date)} · {eventTime(nextEvent)}</span>
              <strong>{nextEvent.title}</strong>
            </Link>
          </div>
        ) : <p className="project-overview-block__empty">예정된 일정이 없습니다.</p>}
      </article>

      <article className="project-overview-block">
        <div className="project-overview-block__heading">
          <TicketCheck aria-hidden="true" size={18} />
          <h3>예약 현황</h3>
        </div>
        <strong>{reservations.length}건</strong>
        {nextReservation ? (
          <div className="project-overview-next">
            <span>다음 예약 · {formatReservationPeriod(nextReservation)}</span>
            <strong>{nextReservation.title}</strong>
          </div>
        ) : <p className="project-overview-block__empty">예정된 예약이 없습니다.</p>}
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

      <article className="project-overview-block project-overview-block--wide">
        <div className="project-overview-block__heading">
          <Activity aria-hidden="true" size={18} />
          <h3>최근 활동</h3>
        </div>
        {recentActivities.length ? (
          <ul className="project-overview-activity">
            {recentActivities.map((activity) => (
              <li key={`${activity.label}-${activity.id}`}>
                <span>{activity.label}</span>
                <strong>{activity.title}</strong>
                <time dateTime={activity.timestamp}>
                  {new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(activity.timestamp))}
                </time>
              </li>
            ))}
          </ul>
        ) : <p className="project-overview-block__empty">아직 기록된 활동이 없습니다.</p>}
      </article>
    </section>
  );
}
