import { addDays } from "@/lib/work-items/recurrence";
import type { EventRow, TaskCategory, TaskPriority, TaskRow } from "@/types/database";

export type CompletionFilter = "all" | "open" | "completed";
export type PeriodFilter = "all" | "today" | "week" | "month";

export interface TaskFilterValues {
  readonly category: TaskCategory | "all";
  readonly completion: CompletionFilter;
  readonly period: PeriodFilter;
  readonly priority: TaskPriority | "all";
  readonly query: string;
}

function containsQuery(title: string, memo: string | null, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  return !normalized || title.toLocaleLowerCase("ko-KR").includes(normalized)
    || (memo?.toLocaleLowerCase("ko-KR").includes(normalized) ?? false);
}

function periodRange(today: string, period: PeriodFilter): readonly [string, string] | null {
  if (period === "all") return null;
  if (period === "today") return [today, today];
  if (period === "month") return [`${today.slice(0, 7)}-01`, `${today.slice(0, 7)}-31`];
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = addDays(today, mondayOffset);
  return [monday, addDays(monday, 6)];
}

export function filterTasks(
  tasks: readonly TaskRow[],
  filters: TaskFilterValues,
  today: string,
): readonly TaskRow[] {
  const range = periodRange(today, filters.period);
  return tasks.filter((task) => {
    const isCompleted = task.status === "completed";
    const dates = [task.scheduled_date, task.due_date, task.follow_up_date].filter(
      (date): date is string => Boolean(date),
    );
    return containsQuery(task.title, task.memo, filters.query)
      && (filters.category === "all" || task.category === filters.category)
      && (filters.priority === "all" || task.priority === filters.priority)
      && (filters.completion === "all"
        || (filters.completion === "completed" ? isCompleted : !isCompleted))
      && (!range || dates.some((date) => date >= range[0] && date <= range[1]));
  });
}

export function filterEvents(
  events: readonly EventRow[],
  query: string,
  period: PeriodFilter,
  today: string,
): readonly EventRow[] {
  const range = periodRange(today, period);
  return events.filter((event) => containsQuery(event.title, event.memo, query)
    && (!range || (event.start_date <= range[1] && event.end_date >= range[0])));
}
