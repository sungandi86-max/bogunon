import { duplicateEvent, duplicateTask, listWorkflowData, saveTaskBundle } from "@/lib/work-items/phase5-repository";
import { listTasks } from "@/lib/work-items/repository";
import { createWorkflowInstanceBundle, saveWorkflowTemplateBundle } from "@/lib/workflows/repository";
import type { AiAction } from "@/lib/ai/schemas/actions";
import type { TaskRow } from "@/types/database";

function writableTask(task: TaskRow) {
  return {
    title: task.title, area: task.area, status: task.status, priority: task.priority, category: task.category,
    scheduled_date: task.scheduled_date, due_date: task.due_date, follow_up_date: task.follow_up_date,
    memo: task.memo, description: task.description, estimated_minutes: task.estimated_minutes,
    completed_at: task.completed_at, recurrence_frequency: task.recurrence_frequency,
  };
}

function workflowSteps(steps: readonly { readonly name: string; readonly description: string | null; readonly checklist: readonly string[] }[]) {
  return steps.map((step, position) => ({
    name: step.name, description: step.description, position, estimatedMinutes: null,
    checklist: step.checklist, links: [], memo: null, internalNotes: null,
    assigneeLabel: null, completionCondition: null,
  }));
}

export async function applyAiAction(action: AiAction): Promise<{ readonly applied: boolean; readonly destination: string }> {
  if (action.action === "create_checklist") {
    if (!action.target_id) throw new Error("체크리스트를 적용할 업무를 선택해 주세요.");
    const [tasks, workflow] = await Promise.all([listTasks(), listWorkflowData()]);
    const task = tasks.find((item) => item.id === action.target_id);
    if (!task) throw new Error("체크리스트를 적용할 업무를 찾지 못했습니다.");
    const existing = workflow.checklistItems.filter((item) => item.task_id === task.id).map((item) => ({ title: item.title, isCompleted: item.is_completed }));
    const generated = action.items.filter((item) => !existing.some((current) => current.title === item.title)).map((item) => ({ title: item.title, isCompleted: item.is_completed }));
    await saveTaskBundle(writableTask(task), {
      checklist: [...existing, ...generated],
      links: workflow.taskLinks.filter((item) => item.task_id === task.id).map((item) => ({ title: item.title, url: item.url })),
      reminders: workflow.taskReminders.filter((item) => item.task_id === task.id).map((item) => ({ offsetMinutes: item.offset_minutes, referenceType: item.reference_type })),
    }, task.id);
    return { applied: true, destination: "/tasks" };
  }
  if (action.action === "recommend_priority") {
    if (!action.target_id) throw new Error("우선순위를 적용할 업무를 선택해 주세요.");
    const [tasks, workflow] = await Promise.all([listTasks(), listWorkflowData()]);
    const task = tasks.find((item) => item.id === action.target_id);
    if (!task) throw new Error("우선순위를 적용할 업무를 찾지 못했습니다.");
    await saveTaskBundle({ ...writableTask(task), priority: action.priority }, {
      checklist: workflow.checklistItems.filter((item) => item.task_id === task.id).map((item) => ({ title: item.title, isCompleted: item.is_completed })),
      links: workflow.taskLinks.filter((item) => item.task_id === task.id).map((item) => ({ title: item.title, url: item.url })),
      reminders: workflow.taskReminders.filter((item) => item.task_id === task.id).map((item) => ({ offsetMinutes: item.offset_minutes, referenceType: item.reference_type })),
    }, task.id);
    return { applied: true, destination: "/tasks" };
  }
  if (action.action === "create_workflow_template") {
    await saveWorkflowTemplateBundle(null, {
      name: action.name, description: action.description, category: action.category,
      default_priority: action.default_priority, recommended_timing: action.recommended_timing,
    }, workflowSteps(action.steps), []);
    return { applied: true, destination: "/workflows" };
  }
  if (action.action === "create_workflow") {
    if (!action.task_id) throw new Error("Workflow를 연결할 업무를 선택해 주세요.");
    await createWorkflowInstanceBundle(action.task_id, action.template_id, {
      name: action.name, description: action.description, category: action.category, priority: action.priority,
    }, workflowSteps(action.steps), []);
    return { applied: true, destination: "/workflows" };
  }
  if (action.action === "duplicate_previous_work") {
    if (action.source_type === "task") await duplicateTask(action.source_id, action.target_date, true, action.include_description, action.include_memo, false);
    else await duplicateEvent(action.source_id, action.target_date, action.include_description, action.include_memo);
    return { applied: true, destination: action.source_type === "task" ? "/tasks" : "/calendar" };
  }
  return { applied: false, destination: "" };
}
