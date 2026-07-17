"use client";

import { CalendarPlus, CheckSquare2, MessageSquareMore, Plus, TriangleAlert } from "lucide-react";

import { useAppShellCreate } from "@/components/layout/app-shell-create-context";
import { Badge } from "@/components/ui/badge";
import { TaskCategoryBadge } from "@/components/tasks/task-category-badge";
import type { EventRow, TaskRow } from "@/types/database";
import { AssistantTrigger } from "@/components/ai/assistant-trigger";

export function OperationsRail({ dueToday, eventsToday, priorityTasks, todayTasks, waitingTasks }: { readonly dueToday: number; readonly eventsToday: EventRow[]; readonly priorityTasks: TaskRow[]; readonly todayTasks: TaskRow[]; readonly waitingTasks: TaskRow[] }) {
  const { openCreate } = useAppShellCreate();
  return <aside className="operations-rail" aria-label="오늘의 운영 항목">
    <section className="rail-module ai-briefing-card" aria-labelledby="ai-briefing-title"><div className="rail-heading"><div><span className="suggestion-label">제안</span><h2 id="ai-briefing-title">AI 업무 도우미</h2></div></div><p>사실 데이터와 분리된 오늘 요약과 우선순위 제안을 확인합니다.</p><AssistantTrigger label="AI 추천 열기" surface="dashboard" /></section>
    <section className="quick-add" aria-labelledby="quick-add-title"><div className="rail-heading"><h2 id="quick-add-title">빠른 추가</h2><Plus aria-hidden="true" size={17} /></div><div className="quick-add__actions"><button onClick={(e) => openCreate(e.currentTarget, "task")} type="button"><CheckSquare2 aria-hidden="true" size={17} />업무</button><button onClick={(e) => openCreate(e.currentTarget, "event")} type="button"><CalendarPlus aria-hidden="true" size={17} />일정</button></div></section>
    <section className="rail-module" aria-labelledby="today-work-title"><div className="rail-heading"><h2 id="today-work-title">오늘 해야 할 일</h2><strong>{todayTasks.length}</strong></div>{todayTasks.length ? todayTasks.slice(0, 5).map((task) => <div className="rail-row" key={task.id}><strong>{task.title}</strong><TaskCategoryBadge category={task.category} /></div>) : <p className="rail-empty">오늘 해야 할 일이 없습니다.</p>}</section>
    <section className="rail-module" aria-labelledby="priority-work-title"><div className="rail-heading"><h2 id="priority-work-title">우선 업무</h2><span className="deadline-count"><TriangleAlert aria-hidden="true" size={14} />오늘 마감 {dueToday}건</span></div>{priorityTasks.length ? priorityTasks.slice(0, 4).map((task) => <div className="rail-row" key={task.id}><strong>{task.title}</strong><Badge tone="deadline">우선</Badge></div>) : <p className="rail-empty">우선 업무가 없습니다.</p>}</section>
    <section className="rail-module" aria-labelledby="reply-title"><div className="rail-heading"><h2 id="reply-title">회신 대기</h2><MessageSquareMore aria-hidden="true" size={17} /></div>{waitingTasks.length ? waitingTasks.slice(0, 4).map((task) => <div className="rail-row" key={task.id}><div><strong>{task.title}</strong><small>{task.follow_up_date ? `${task.follow_up_date} 확인` : "확인일 미정"}</small></div><Badge tone="waiting">대기</Badge></div>) : <p className="rail-empty">회신 대기 업무가 없습니다.</p>}</section>
    <section className="rail-module" aria-labelledby="schedule-title"><div className="rail-heading"><h2 id="schedule-title">오늘 일정</h2><span>{eventsToday.length}</span></div>{eventsToday.length ? eventsToday.slice(0, 5).map((event) => <div className="rail-row rail-row--time" key={event.id}><time>{event.is_all_day ? "종일" : event.start_time?.slice(0, 5)}</time><strong>{event.title}</strong></div>) : <p className="rail-empty">오늘 일정이 없습니다.</p>}</section>
  </aside>;
}
