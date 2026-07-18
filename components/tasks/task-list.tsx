import { Bell, Circle, Copy, ExternalLink, ListChecks, MoreHorizontal, Pencil, Repeat2, Save, Trash2 } from "lucide-react";

import { deleteWorkItemAction, duplicateWorkItemAction, saveWorkItemAsTemplateAction, toggleChecklistItemAction } from "@/app/(app)/work-item-actions";
import { CreateItemForm } from "@/components/layout/create-item-form";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { TaskCategoryBadge } from "@/components/tasks/task-category-badge";
import { Badge } from "@/components/ui/badge";
import type { RecurrenceFrequency, TaskRow } from "@/types/database";
import type { WorkflowData } from "@/lib/work-items/phase5-repository";
import { checklistProgress } from "@/lib/work-items/workflow";
import { TaskCompletionButton } from "@/components/tasks/task-completion-button";
import { calculateWorkflowProgress, deriveNextWorkflowAction } from "@/lib/workflows/domain";
import type { HealthWorkflowData } from "@/types/workflows";
import { AssistantTrigger } from "@/components/ai/assistant-trigger";

const areaLabel = { healthWork: "보건업무", schoolSchedule: "학교일정", exercise: "운동", personal: "개인일정", project: "업무" } as const;
const recurrenceLabel = { daily: "매일", weekly: "매주", monthly: "매월", yearly: "매년" } satisfies Record<RecurrenceFrequency, string>;

export function TaskList({ tasks, workflow, healthWorkflows }: { readonly tasks: readonly TaskRow[]; readonly workflow: WorkflowData; readonly healthWorkflows?: HealthWorkflowData | undefined }) {
  if (!tasks.length) return <section className="empty-state"><Circle aria-hidden="true" /><div><h2>조건에 맞는 업무가 없습니다.</h2><p>검색어나 필터를 바꾸거나 빠른 추가에서 업무를 등록해 보세요.</p></div></section>;
  return <section className="work-item-list" aria-label="업무 목록">{tasks.map((task) => {
    const checklist = workflow.checklistItems.filter((item) => item.task_id === task.id);
    const links = workflow.taskLinks.filter((item) => item.task_id === task.id);
    const reminders = workflow.taskReminders.filter((item) => item.task_id === task.id);
    const progress = checklistProgress(checklist);
    const instance = healthWorkflows?.instances.find((item) => item.task_id === task.id);
    const followupRule = healthWorkflows?.followups.find((item) => item.generated_task_id === task.id);
    const sourceInstance = followupRule?.instance_id ? healthWorkflows?.instances.find((item) => item.id === followupRule.instance_id) : undefined;
    const instanceSteps = instance ? healthWorkflows?.steps.filter((item) => item.instance_id === instance.id) ?? [] : [];
    const workflowSnapshot = instanceSteps.map((step) => ({ id: step.id, name: step.name, position: step.position, status: step.status, incompleteChecklist: healthWorkflows?.checklistItems.filter((item) => item.workflow_step_id === step.id && !item.is_completed).length ?? 0 }));
    const workflowProgress = calculateWorkflowProgress(workflowSnapshot);
    const nextWorkflow = deriveNextWorkflowAction(workflowSnapshot);
    return (
    <article className="work-item-card" key={task.id}>
      <div className="work-item-card__main">
        <TaskCompletionButton completed={task.status === "completed"} incompleteChecklist={progress.total - progress.completed} taskId={task.id} title={task.title} />
        <div><strong className={task.status === "completed" ? "is-completed" : undefined}>{task.title}</strong><div className="work-item-meta"><TaskCategoryBadge category={task.category} /><Badge tone={task.area === "schoolSchedule" ? "school" : task.area === "exercise" ? "exercise" : task.area === "personal" ? "personal" : "health"}>{areaLabel[task.area]}</Badge><span>{task.due_date ? `마감 ${task.due_date}` : task.scheduled_date ? `수행 ${task.scheduled_date}` : "날짜 미정"}</span>{task.recurrence_frequency && <span className="recurrence-label"><Repeat2 aria-hidden="true" size={12} />{recurrenceLabel[task.recurrence_frequency]}</span>}{progress.total > 0 && <span className="checklist-progress"><ListChecks size={13} />{progress.completed}/{progress.total} 완료 · {progress.percentage}%</span>}{reminders.length > 0 && <span><Bell size={12} /> 알림 {reminders.length}</span>}<span>{task.status === "waitingForReply" ? "회신 대기" : task.priority === "high" ? "우선" : ""}</span></div></div>
      </div>
      {instance && <a className="task-workflow-summary" href={`/workflows#workflow-${instance.id}`}><span><strong>{instance.name}</strong><small>현재 {nextWorkflow.stepName ?? "완료 확인"}</small></span><b>{workflowProgress.completed}/{workflowProgress.total} · {workflowProgress.percentage}%</b></a>}
      {sourceInstance && <a className="task-workflow-summary" href={`/workflows#workflow-${sourceInstance.id}`}><span><strong>업무 절차 후속 업무</strong><small>{sourceInstance.name}에서 자동 생성됨</small></span><b>원본 보기</b></a>}
      {(checklist.length > 0 || links.length > 0) && <details className="work-item-details"><summary>세부 항목</summary>{checklist.length > 0 && <div className="saved-checklist">{checklist.map((item) => <form action={toggleChecklistItemAction} key={item.id}><input name="id" type="hidden" value={item.id} /><input name="completed" type="hidden" value={String(!item.is_completed)} /><button className={item.is_completed ? "is-completed" : undefined} type="submit">{item.is_completed ? <span>✓</span> : <span>○</span>}{item.title}</button></form>)}</div>}{links.length > 0 && <div className="saved-links">{links.map((link) => <a href={link.url} key={link.id} rel="noreferrer" target="_blank"><ExternalLink size={13} />{link.title}</a>)}</div>}</details>}
      <div className="work-item-actions"><details className="work-item-edit"><summary><Pencil aria-hidden="true" size={16} />편집</summary><div className="inline-editor"><CreateItemForm checklistItems={checklist} initialItem={task} links={links} reminders={reminders} /></div></details><details className="work-item-more"><summary><MoreHorizontal aria-hidden="true" size={17} />더보기</summary><div className="work-item-more-menu"><details className="work-item-duplicate"><summary><Copy aria-hidden="true" size={16} />복제</summary><form action={duplicateWorkItemAction} className="duplicate-menu"><input name="id" type="hidden" value={task.id} /><input name="kind" type="hidden" value="task" /><label>새 날짜<CalendarDateInput name="date" /></label><label><input defaultChecked name="includeChecklist" type="checkbox" />체크리스트</label><label><input defaultChecked name="includeDescription" type="checkbox" />설명</label><label><input defaultChecked name="includeMemo" type="checkbox" />메모</label>{task.recurrence_frequency && <label><input name="includeRecurrence" type="checkbox" />반복 설정</label>}<button className="button button--primary" type="submit">새 업무로 복제</button></form></details><form action={saveWorkItemAsTemplateAction}><input name="id" type="hidden" value={task.id} /><input name="kind" type="hidden" value="task" /><button className="menu-action" type="submit"><Save size={16} />템플릿으로 저장</button></form><AssistantTrigger entityId={task.id} label="내용 제안" surface="task" /><form action={deleteWorkItemAction}><input name="id" type="hidden" value={task.id} /><input name="kind" type="hidden" value="task" /><button className="menu-action menu-action--danger" type="submit"><Trash2 aria-hidden="true" size={16} />삭제</button></form></div></details></div>
    </article>
  );})}</section>;
}
