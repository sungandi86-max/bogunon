"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { TaskList } from "@/components/tasks/task-list";
import { TASK_CATEGORY_OPTIONS } from "@/lib/work-items/categories";
import { filterEvents, filterTasks } from "@/lib/work-items/filters";
import type { CompletionFilter, PeriodFilter } from "@/lib/work-items/filters";
import { TASK_CATEGORIES } from "@/types/database";
import type { EventRow, TaskCategory, TaskPriority, TaskRow } from "@/types/database";
import type { WorkflowData } from "@/lib/work-items/phase5-repository";
import type { HealthWorkflowData } from "@/types/workflows";

const completionOptions = ["all", "open", "completed"] as const;
const periodOptions = ["all", "today", "week", "month"] as const;
const priorityOptions = ["all", "high", "normal", "low"] as const;
const categoryOptions = ["all", ...TASK_CATEGORIES] as const;
const emptyWorkflow: WorkflowData = { templates: [], templateChecklistItems: [], checklistItems: [], taskLinks: [], eventLinks: [], taskReminders: [], eventReminders: [] };

export function TaskWorkspace({
  events,
  tasks,
  today,
  workflow = emptyWorkflow,
  healthWorkflows,
}: {
  readonly events: readonly EventRow[];
  readonly tasks: readonly TaskRow[];
  readonly today: string;
  readonly workflow?: WorkflowData;
  readonly healthWorkflows?: HealthWorkflowData;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TaskCategory | "all">("all");
  const [completion, setCompletion] = useState<CompletionFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [year, setYear] = useState("all");
  const years = useMemo(() => [...new Set(tasks.map((task) => (task.scheduled_date ?? task.due_date ?? task.created_at).slice(0, 4)))].toSorted().reverse(), [tasks]);
  const visibleTasks = useMemo(() => filterTasks(tasks, { category, completion, period, priority, query }, today).filter((task) => year === "all" || (task.scheduled_date ?? task.due_date ?? task.created_at).startsWith(year)), [category, completion, period, priority, query, tasks, today, year]);
  const matchingEvents = useMemo(
    () => query.trim() ? filterEvents(events, query, period, today) : [],
    [events, period, query, today],
  );
  const hasFilters = Boolean(query.trim()) || category !== "all" || completion !== "all"
    || period !== "all" || priority !== "all" || year !== "all";

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setCompletion("all");
    setPeriod("all");
    setPriority("all");
    setYear("all");
  }

  function updateCategory(value: string) {
    const next = categoryOptions.find((option) => option === value);
    if (next) setCategory(next);
  }

  function updateCompletion(value: string) {
    const next = completionOptions.find((option) => option === value);
    if (next) setCompletion(next);
  }

  function updatePeriod(value: string) {
    const next = periodOptions.find((option) => option === value);
    if (next) setPeriod(next);
  }

  function updatePriority(value: string) {
    const next = priorityOptions.find((option) => option === value);
    if (next) setPriority(next);
  }

  return (
    <section className="task-workspace" aria-labelledby="task-tools-title">
      <h2 className="sr-only" id="task-tools-title">업무 검색과 필터</h2>
      <div className="task-tools">
        <label className="task-search">
          <span className="sr-only">업무, 일정과 메모 검색</span>
          <Search aria-hidden="true" size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="업무, 일정, 메모 검색"
            type="search"
            value={query}
          />
        </label>
        <div className="task-filters" aria-label="업무 필터" role="group">
          <SlidersHorizontal aria-hidden="true" size={17} />
          <label><span>카테고리</span><select onChange={(event) => updateCategory(event.target.value)} value={category}><option value="all">전체</option>{TASK_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label><span>완료 여부</span><select onChange={(event) => updateCompletion(event.target.value)} value={completion}><option value="all">전체</option><option value="open">미완료</option><option value="completed">완료</option></select></label>
          <label><span>기간</span><select onChange={(event) => updatePeriod(event.target.value)} value={period}><option value="all">전체</option><option value="today">오늘</option><option value="week">이번 주</option><option value="month">이번 달</option></select></label>
          <label><span>우선순위</span><select onChange={(event) => updatePriority(event.target.value)} value={priority}><option value="all">전체</option><option value="high">높음</option><option value="normal">보통</option><option value="low">낮음</option></select></label>
          <label><span>연도</span><select onChange={(event) => setYear(event.target.value)} value={year}><option value="all">전체</option>{years.map((item) => <option key={item} value={item}>{item}년</option>)}</select></label>
          {hasFilters && <button className="filter-reset" onClick={resetFilters} type="button"><X aria-hidden="true" size={15} />초기화</button>}
        </div>
      </div>
      <div className="task-results-summary" aria-live="polite">
        <span>업무 {visibleTasks.length}건</span>
        {completion === "completed" && <span>완료 업무는 복제하거나 템플릿으로 다시 사용할 수 있습니다.</span>}
        {query.trim() && <span>일정 {matchingEvents.length}건</span>}
      </div>
      {query.trim() && matchingEvents.length > 0 && (
        <section className="search-event-results" aria-labelledby="event-search-title">
          <h2 id="event-search-title">일정 검색 결과</h2>
          {matchingEvents.map((event) => <div key={event.id}><time>{event.start_date}{event.start_time ? ` ${event.start_time.slice(0, 5)}` : ""}</time><strong>{event.title}</strong>{event.memo?.toLocaleLowerCase("ko-KR").includes(query.trim().toLocaleLowerCase("ko-KR")) && <span>메모 일치</span>}</div>)}
        </section>
      )}
      <TaskList healthWorkflows={healthWorkflows} tasks={visibleTasks} workflow={workflow} />
    </section>
  );
}
