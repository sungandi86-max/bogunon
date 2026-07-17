"use client";

import { CalendarPlus, CheckSquare2, FilePenLine, MessageSquareMore, TriangleAlert } from "lucide-react";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { Badge } from "@/components/ui/badge";
import { TaskCategoryBadge } from "@/components/tasks/task-category-badge";
import type { EventRow, TaskRow } from "@/types/database";
import { AssistantTrigger } from "@/components/ai/assistant-trigger";
import { WorkflowBriefing, type WorkflowBriefingItem } from "@/components/briefing/workflow-briefing";

export function OperationsRail({ dueToday, eventsToday, priorityTasks, todayTasks, waitingTasks, workflowItems }: { readonly dueToday: number; readonly eventsToday: EventRow[]; readonly priorityTasks: TaskRow[]; readonly todayTasks: TaskRow[]; readonly waitingTasks: TaskRow[]; readonly workflowItems: readonly WorkflowBriefingItem[] }) {
  const { openCreate } = useAppShellCreate();
  return <aside className="operations-rail" aria-label="오늘의 운영 항목">
    <section className="rail-module" aria-labelledby="today-work-title"><div className="rail-heading"><h2 id="today-work-title">오늘 해야 할 일</h2><strong>{todayTasks.length}</strong></div>{todayTasks.length ? todayTasks.slice(0, 5).map((task) => <div className="rail-row" key={task.id}><strong>{task.title}</strong><TaskCategoryBadge category={task.category} /></div>) : <p className="rail-empty">오늘 해야 할 일이 없습니다.</p>}</section>
    <section className="rail-module" aria-labelledby="priority-work-title"><div className="rail-heading"><h2 id="priority-work-title">마감 임박 업무</h2><span className="deadline-count"><TriangleAlert aria-hidden="true" size={14} />오늘 {dueToday}건</span></div>{priorityTasks.length ? priorityTasks.slice(0, 4).map((task) => <div className="rail-row" key={task.id}><strong>{task.title}</strong><Badge tone="deadline">우선</Badge></div>) : <p className="rail-empty">오늘 확인할 우선 업무가 없습니다.</p>}</section>
    <WorkflowBriefing compact items={workflowItems} />
    <section className="rail-module" aria-labelledby="reply-title"><div className="rail-heading"><h2 id="reply-title">회신 대기</h2><MessageSquareMore aria-hidden="true" size={17} /></div>{waitingTasks.length ? waitingTasks.slice(0, 4).map((task) => <div className="rail-row" key={task.id}><div><strong>{task.title}</strong><small>{task.follow_up_date ? `${task.follow_up_date} 확인` : "확인일 미정"}</small></div><Badge tone="waiting">대기</Badge></div>) : <p className="rail-empty">회신 대기 업무가 없습니다.</p>}</section>
    <section className="rail-module" aria-labelledby="schedule-title"><div className="rail-heading"><h2 id="schedule-title">오늘 일정</h2><span>{eventsToday.length}</span></div>{eventsToday.length ? eventsToday.slice(0, 5).map((event) => <div className="rail-row rail-row--time" key={event.id}><time>{event.is_all_day ? "종일" : event.start_time?.slice(0, 5)}</time><strong>{event.title}</strong></div>) : <p className="rail-empty">오늘 일정이 없습니다.</p>}</section>
    <section className="quick-note" aria-labelledby="quick-note-title"><div className="rail-heading"><div><span className="rail-kicker">바로 기록</span><h2 id="quick-note-title">빠른 메모</h2></div><FilePenLine aria-hidden="true" size={17} /></div><p>떠오른 내용을 업무나 일정으로 바로 정리하세요.</p><div className="quick-add__actions"><button onClick={(event) => openCreate(event.currentTarget, "task")} type="button"><CheckSquare2 aria-hidden="true" size={17} />업무 메모</button><button onClick={(event) => openCreate(event.currentTarget, "event")} type="button"><CalendarPlus aria-hidden="true" size={17} />일정</button></div></section>
    <section className="rail-module daily-summary-card" aria-labelledby="daily-summary-title"><div className="rail-heading"><div><span className="suggestion-label">선택 제안</span><h2 id="daily-summary-title">오늘의 정리</h2></div></div><p>현재 업무를 바탕으로 우선순위와 다음 행동을 정리합니다.</p><AssistantTrigger label="작성 도움 열기" surface="dashboard" /></section>
  </aside>;
}
