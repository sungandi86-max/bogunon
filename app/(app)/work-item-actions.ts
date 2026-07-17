"use server";

import { revalidatePath } from "next/cache";

import { removeWorkItem, saveEvent, saveTask, setTaskCompleted } from "@/lib/work-items/repository";
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
}

export async function saveWorkItemAction(_state: WorkItemActionState, formData: FormData): Promise<WorkItemActionState> {
  try {
    const kind = formData.get("kind") === "event" ? "event" : "task";
    const id = optional(formData, "id") ?? undefined;
    const title = String(formData.get("title") ?? "").trim();
    const areaValue = String(formData.get("area") ?? "healthWork") as Area;
    if (!title) return { status: "error", message: "제목을 입력해 주세요." };
    if (!areas.has(areaValue)) return { status: "error", message: "유효한 영역을 선택해 주세요." };

    if (kind === "event") {
      const startDate = String(formData.get("startDate") ?? "");
      const endDate = String(formData.get("endDate") ?? startDate);
      const isAllDay = formData.get("isAllDay") === "on";
      if (!startDate || !endDate || endDate < startDate) return { status: "error", message: "일정 날짜를 확인해 주세요." };
      await saveEvent({
        title, area: areaValue, start_date: startDate, end_date: endDate, is_all_day: isAllDay,
        start_time: isAllDay ? null : optional(formData, "startTime"),
        end_time: isAllDay ? null : optional(formData, "endTime"),
        memo: optional(formData, "memo"),
      }, id);
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
      await saveTask({
        title, area: areaValue, status: statusValue, priority: priorityValue, category: categoryValue,
        scheduled_date: scheduledDate, due_date: optional(formData, "dueDate"),
        follow_up_date: optional(formData, "followUpDate"), memo: optional(formData, "memo"),
        completed_at: statusValue === "completed" ? new Date().toISOString() : null,
        recurrence_frequency: recurrenceFrequency,
      }, id);
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
