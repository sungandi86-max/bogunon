import { createClient } from "@/lib/supabase/server";
import type {
  EventLinkRow,
  EventReminderRow,
  EventRow,
  Json,
  ReminderReference,
  TaskChecklistItemRow,
  TaskLinkRow,
  TaskReminderRow,
  TaskRow,
  TaskTemplateChecklistItemRow,
  TaskTemplateRow,
} from "@/types/database";
import type { TaskWriteValues } from "@/lib/work-items/repository";
import { eventDuplicateValues } from "@/lib/work-items/workflow";

export type ChecklistDraft = { readonly title: string; readonly isCompleted?: boolean };
export type LinkDraft = { readonly title: string; readonly url: string };
export type ReminderDraft = { readonly offsetMinutes: number; readonly referenceType?: ReminderReference };

export type WorkflowData = {
  readonly templates: readonly TaskTemplateRow[];
  readonly templateChecklistItems: readonly TaskTemplateChecklistItemRow[];
  readonly checklistItems: readonly TaskChecklistItemRow[];
  readonly taskLinks: readonly TaskLinkRow[];
  readonly eventLinks: readonly EventLinkRow[];
  readonly taskReminders: readonly TaskReminderRow[];
  readonly eventReminders: readonly EventReminderRow[];
};

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

type EventWriteValues = Omit<EventRow, "id" | "user_id" | "created_at" | "updated_at">;
type WorkItemRelations = {
  readonly checklist: readonly ChecklistDraft[];
  readonly links: readonly LinkDraft[];
  readonly reminders: readonly ReminderDraft[];
};

export async function saveTaskBundle(values: TaskWriteValues, relations: WorkItemRelations, id?: string) {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("save_work_item_bundle", {
    p_kind: "task", p_item_id: id ?? null, p_values: values as Json,
    p_checklist: relations.checklist as Json, p_links: relations.links as Json, p_reminders: relations.reminders as Json,
  });
  if (error) throw new Error("업무와 상세 항목을 저장하지 못했습니다.");
  return data;
}

export async function saveEventBundle(values: EventWriteValues, relations: Omit<WorkItemRelations, "checklist">, id?: string) {
  const { supabase } = await ownedClient();
  const current = await supabase.rpc("save_event_bundle_v3", {
    p_item_id: id ?? null, p_values: values as Json,
    p_links: relations.links as Json, p_reminders: relations.reminders as Json,
  });
  if (!current.error) return current.data;
  if (current.error.code === "PGRST202") {
    const previous = await supabase.rpc("save_event_bundle_v2", {
      p_item_id: id ?? null, p_values: values as Json,
      p_links: relations.links as Json, p_reminders: relations.reminders as Json,
    });
    if (!previous.error) return previous.data;
    if (previous.error.code !== "PGRST202") throw new Error("일정과 상세 항목을 저장하지 못했습니다.");
    const legacyValues = {
      title: values.title, area: values.area, start_date: values.start_date, end_date: values.end_date,
      is_all_day: values.is_all_day, start_time: values.start_time, end_time: values.end_time,
      memo: values.memo, description: values.description,
    };
    const legacy = await supabase.rpc("save_work_item_bundle", {
      p_kind: "event", p_item_id: id ?? null, p_values: legacyValues as Json,
      p_checklist: [], p_links: relations.links as Json, p_reminders: relations.reminders as Json,
    });
    if (legacy.error) throw new Error("일정과 상세 항목을 저장하지 못했습니다.");
    return legacy.data;
  }
  throw new Error("일정과 상세 항목을 저장하지 못했습니다.");
}

export async function listWorkflowData(): Promise<WorkflowData> {
  const { supabase, userId } = await ownedClient();
  const [templates, templateItems, checklist, taskLinks, eventLinks, taskReminders, eventReminders] = await Promise.all([
    supabase.from("task_templates").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("task_template_checklist_items").select("*").eq("user_id", userId).order("position"),
    supabase.from("task_checklist_items").select("*").eq("user_id", userId).order("position"),
    supabase.from("task_links").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("event_links").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("task_reminders").select("*").eq("user_id", userId).order("offset_minutes"),
    supabase.from("event_reminders").select("*").eq("user_id", userId).order("offset_minutes"),
  ]);
  if (templates.error || templateItems.error || checklist.error || taskLinks.error || eventLinks.error || taskReminders.error || eventReminders.error) {
    throw new Error("업무 상세 데이터를 불러오지 못했습니다.");
  }
  return {
    templates: templates.data,
    templateChecklistItems: templateItems.data,
    checklistItems: checklist.data,
    taskLinks: taskLinks.data,
    eventLinks: eventLinks.data,
    taskReminders: taskReminders.data,
    eventReminders: eventReminders.data,
  };
}

export async function setChecklistItemCompleted(id: string, completed: boolean) {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("task_checklist_items").update({ is_completed: completed }).eq("id", id).eq("user_id", userId);
  if (error) throw new Error("체크리스트 상태를 저장하지 못했습니다.");
}

export async function saveCustomTemplate(values: Omit<TaskTemplateRow, "id" | "user_id" | "created_at" | "updated_at">, checklist: readonly string[]) {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("save_task_template_bundle", { p_values: values as Json, p_checklist: checklist as Json });
  if (error) throw new Error("내 템플릿을 저장하지 못했습니다.");
  return data;
}

export async function duplicateTask(sourceId: string, date: string | null, includeChecklist: boolean, includeDescription: boolean, includeMemo: boolean, includeRecurrence: boolean) {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.rpc("duplicate_task_bundle", {
    p_source_id: sourceId, p_date: date, p_include_checklist: includeChecklist,
    p_include_description: includeDescription, p_include_memo: includeMemo, p_include_recurrence: includeRecurrence,
  });
  if (error) throw new Error("업무를 복제하지 못했습니다.");
  return data;
}

export async function duplicateEvent(sourceId: string, date: string | null, includeDescription: boolean, includeMemo: boolean) {
  const { supabase, userId } = await ownedClient();
  const { data: source, error } = await supabase.from("events").select("*").eq("id", sourceId).eq("user_id", userId).single();
  if (error) throw new Error("복제할 일정을 찾지 못했습니다.");
  const { data, error: insertError } = await supabase.from("events").insert({
    user_id: userId,
    ...eventDuplicateValues(source, { date, includeDescription, includeMemo }),
  }).select("id").single();
  if (insertError) throw new Error("일정을 복제하지 못했습니다.");
  return data.id;
}

export function templateFromTask(task: TaskRow): Omit<TaskTemplateRow, "id" | "user_id" | "created_at" | "updated_at"> {
  return {
    name: task.title,
    item_kind: "task",
    category: task.category,
    title: task.title,
    description: task.description,
    priority: task.priority,
    estimated_minutes: task.estimated_minutes,
    recommended_timing: null,
    recurrence_frequency: task.recurrence_frequency,
    memo: task.memo,
  };
}

export function templateFromEvent(event: EventRow): Omit<TaskTemplateRow, "id" | "user_id" | "created_at" | "updated_at"> {
  return {
    name: event.title,
    item_kind: "event",
    category: "event",
    title: event.title,
    description: event.description,
    priority: "normal",
    estimated_minutes: null,
    recommended_timing: null,
    recurrence_frequency: null,
    memo: event.memo,
  };
}
