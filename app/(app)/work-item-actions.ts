"use server";

import { revalidatePath } from "next/cache";

import { removeWorkItem, setTaskCompleted } from "@/lib/work-items/repository";
import {
  duplicateEvent,
  duplicateTask,
  listWorkflowData,
  saveCustomTemplate,
  saveEventBundle,
  saveTaskBundle,
  setChecklistItemCompleted,
  templateFromEvent,
  templateFromTask,
} from "@/lib/work-items/phase5-repository";
import { BUILT_IN_TEMPLATES, parseWorkItemRelations } from "@/lib/work-items/workflow";
import { listAllEvents, listTasks } from "@/lib/work-items/repository";
import {
  RECURRENCE_FREQUENCIES,
  TASK_CATEGORIES,
} from "@/types/database";
import type { Area, TaskStatus } from "@/types/database";

export interface WorkItemActionState {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
}

const areas = new Set<Area>(["healthWork", "schoolSchedule", "exercise", "personal", "project"]);
const statuses = new Set<TaskStatus>(["planned", "inProgress", "waitingForReply", "needsCheck", "completed", "onHold"]);
const priorities = ["low", "normal", "high"] as const;

function optional(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function refreshWorkItems() {
  revalidatePath("/briefing");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/annual");
  revalidatePath("/templates");
  revalidatePath("/workflows");
}

export async function saveWorkItemAction(_state: WorkItemActionState, formData: FormData): Promise<WorkItemActionState> {
  try {
    const kind = formData.get("kind") === "event" ? "event" : "task";
    const id = optional(formData, "id") ?? undefined;
    const title = String(formData.get("title") ?? "").trim();
    const areaValue = String(formData.get("area") ?? "healthWork") as Area;
    if (!title) return { status: "error", message: "제목을 입력해 주세요." };
    if (!areas.has(areaValue)) return { status: "error", message: "유효한 영역을 선택해 주세요." };
    const relations = parseWorkItemRelations(formData);

    if (kind === "event") {
      const startDate = String(formData.get("startDate") ?? "");
      const endDate = String(formData.get("endDate") ?? startDate);
      const isAllDay = formData.get("isAllDay") === "on";
      if (!startDate || !endDate || endDate < startDate) return { status: "error", message: "일정 날짜를 확인해 주세요." };
      await saveEventBundle({
        title, area: areaValue, start_date: startDate, end_date: endDate, is_all_day: isAllDay,
        start_time: isAllDay ? null : optional(formData, "startTime"),
        end_time: isAllDay ? null : optional(formData, "endTime"),
        memo: optional(formData, "memo"), description: optional(formData, "description"),
      }, { links: relations.links, reminders: relations.reminders }, id);
    } else {
      const statusValue = String(formData.get("status") ?? "planned") as TaskStatus;
      const priorityRaw = String(formData.get("priority") ?? "normal");
      const priorityValue = priorities.find((priority) => priority === priorityRaw);
      const categoryRaw = String(formData.get("category") ?? "other");
      const categoryValue = TASK_CATEGORIES.find((category) => category === categoryRaw);
      const recurrenceValue = optional(formData, "recurrenceFrequency");
      const recurrenceFrequency = RECURRENCE_FREQUENCIES.find((frequency) => frequency === recurrenceValue) ?? null;
      const scheduledDate = optional(formData, "scheduledDate");
      if (!statuses.has(statusValue) || !priorityValue || !categoryValue) {
        return { status: "error", message: "업무 분류와 상태를 확인해 주세요." };
      }
      if (recurrenceValue && !recurrenceFrequency) {
        return { status: "error", message: "반복 주기를 확인해 주세요." };
      }
      if (recurrenceFrequency && !scheduledDate) {
        return { status: "error", message: "반복 업무는 수행일을 입력해 주세요." };
      }
      const estimatedRaw = optional(formData, "estimatedMinutes");
      const estimatedMinutes = estimatedRaw ? Number(estimatedRaw) : null;
      if (estimatedMinutes !== null && (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1 || estimatedMinutes > 1440)) {
        return { status: "error", message: "예상 소요 시간은 1~1440분으로 입력해 주세요." };
      }
      await saveTaskBundle({
        title, area: areaValue, status: statusValue, priority: priorityValue, category: categoryValue,
        scheduled_date: scheduledDate, due_date: optional(formData, "dueDate"),
        follow_up_date: optional(formData, "followUpDate"), memo: optional(formData, "memo"),
        description: optional(formData, "description"), estimated_minutes: estimatedMinutes,
        completed_at: statusValue === "completed" ? new Date().toISOString() : null,
        recurrence_frequency: recurrenceFrequency,
      }, relations, id);
    }
    refreshWorkItems();
    return { status: "success", message: "저장했습니다." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "저장하지 못했습니다." };
  }
}

export async function deleteWorkItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const table = formData.get("kind") === "event" ? "events" : "tasks";
  if (id) await removeWorkItem(table, id);
  refreshWorkItems();
}

export async function toggleTaskAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const completed = formData.get("completed") === "true";
  if (id) await setTaskCompleted(id, completed);
  refreshWorkItems();
}

export async function toggleChecklistItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await setChecklistItemCompleted(id, formData.get("completed") === "true");
  refreshWorkItems();
}

export async function duplicateWorkItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const date = optional(formData, "date");
  if (formData.get("kind") === "event") {
    await duplicateEvent(id, date, formData.get("includeDescription") === "on", formData.get("includeMemo") === "on");
  } else {
    await duplicateTask(
      id,
      date,
      formData.get("includeChecklist") === "on",
      formData.get("includeDescription") === "on",
      formData.get("includeMemo") === "on",
      formData.get("includeRecurrence") === "on",
    );
  }
  refreshWorkItems();
}

export async function cloneBuiltInTemplateAction(formData: FormData) {
  const key = String(formData.get("key") ?? "");
  const template = BUILT_IN_TEMPLATES.find((item) => item.key === key);
  if (!template) return;
  await saveCustomTemplate({
    name: `${template.name} 복사본`, item_kind: template.kind, category: template.category,
    title: template.title, description: template.description, priority: template.priority,
    estimated_minutes: template.estimatedMinutes, recommended_timing: template.recommendedTiming,
    recurrence_frequency: template.recurrenceFrequency, memo: template.memo,
  }, template.checklist);
  refreshWorkItems();
}

export async function saveWorkItemAsTemplateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (formData.get("kind") === "event") {
    const event = (await listAllEvents()).find((item) => item.id === id);
    if (event) await saveCustomTemplate(templateFromEvent(event), []);
  } else {
    const task = (await listTasks()).find((item) => item.id === id);
    if (task) {
      const workflow = await listWorkflowData();
      await saveCustomTemplate(templateFromTask(task), workflow.checklistItems.filter((item) => item.task_id === id).map((item) => item.title));
    }
  }
  refreshWorkItems();
}
