import { createClient } from "@/lib/supabase/server";
import { occurrenceDatesThrough, shiftFromAnchor } from "@/lib/work-items/recurrence";
import type { Database, EventRow, TaskRow } from "@/types/database";
import type { CalendarItemKind, CalendarMoveScope } from "@/lib/calendar/smart-calendar";

export type TaskWriteValues = Omit<
  TaskRow,
  "id" | "user_id" | "created_at" | "updated_at" | "recurrence_source_id" | "recurrence_date" | "recurrence_generated_through"
>;
type DatabaseTaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type DatabaseEventInsert = Database["public"]["Tables"]["events"]["Insert"];

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listTasks(): Promise<TaskRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error("업무를 불러오지 못했습니다.");
  return data;
}

export async function listEvents(first: string, last: string): Promise<EventRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("events").select("*").eq("user_id", userId).lte("start_date", last).gte("end_date", first).order("start_date");
  if (error) throw new Error("일정을 불러오지 못했습니다.");
  return data;
}

export async function listAllEvents(): Promise<EventRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("events").select("*").eq("user_id", userId).order("start_date", { ascending: false });
  if (error) throw new Error("일정을 불러오지 못했습니다.");
  return data;
}

export async function updateEventDescription(id: string, description: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("events").update({ description }).eq("id", id).eq("user_id", userId);
  if (error) throw new Error("일정 상태를 저장하지 못했습니다.");
}

export async function saveTask(values: TaskWriteValues, id?: string): Promise<string> {
  const { supabase, userId } = await ownedClient();
  const recurrenceDate = values.recurrence_frequency ? values.scheduled_date : null;
  let recurrenceGeneratedThrough = recurrenceDate;
  if (id) {
    const { data: current, error } = await supabase
      .from("tasks")
      .select("recurrence_date,recurrence_frequency,recurrence_generated_through")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error("업무를 확인하지 못했습니다.");
    const recurrenceChanged = current.recurrence_date !== recurrenceDate
      || current.recurrence_frequency !== values.recurrence_frequency;
    recurrenceGeneratedThrough = recurrenceChanged
      ? recurrenceDate
      : current.recurrence_generated_through;
  }
  if (id) {
    const { error } = await supabase.from("tasks").update({
      ...values,
      recurrence_date: recurrenceDate,
      recurrence_generated_through: recurrenceGeneratedThrough,
    }).eq("id", id).eq("user_id", userId);
    if (error) throw new Error("업무를 저장하지 못했습니다.");
    return id;
  }
  const { data, error } = await supabase.from("tasks").insert({
      ...values,
      user_id: userId,
      recurrence_source_id: null,
      recurrence_date: recurrenceDate,
      recurrence_generated_through: recurrenceGeneratedThrough,
    }).select("id").single();
  if (error) throw new Error("업무를 저장하지 못했습니다.");
  return data.id;
}

export async function ensureRecurringTasks(throughDate: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { data: roots, error: rootsError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .is("recurrence_source_id", null)
    .not("recurrence_frequency", "is", null)
    .lte("recurrence_date", throughDate);
  if (rootsError) throw new Error("반복 업무를 확인하지 못했습니다.");
  if (!roots.length) return;

  const inserts: DatabaseTaskInsert[] = [];
  const generatedThroughUpdates: Array<{ id: string; date: string }> = [];
  for (const root of roots) {
    if (!root.recurrence_frequency || !root.recurrence_date) continue;
    const generationAnchor = root.recurrence_generated_through ?? root.recurrence_date;
    const occurrenceDates = occurrenceDatesThrough(generationAnchor, throughDate, root.recurrence_frequency);
    for (const occurrenceDate of occurrenceDates) {
      inserts.push({
        user_id: userId,
        title: root.title,
        area: root.area,
        status: "planned",
        priority: root.priority,
        category: root.category,
        scheduled_date: occurrenceDate,
        due_date: shiftFromAnchor(root.recurrence_date, root.due_date, occurrenceDate),
        follow_up_date: shiftFromAnchor(root.recurrence_date, root.follow_up_date, occurrenceDate),
        memo: root.memo,
        description: root.description,
        estimated_minutes: root.estimated_minutes,
        completed_at: null,
        recurrence_frequency: root.recurrence_frequency,
        recurrence_source_id: root.id,
        recurrence_date: occurrenceDate,
        recurrence_generated_through: null,
      });
    }
    const lastOccurrenceDate = occurrenceDates.at(-1);
    if (lastOccurrenceDate) generatedThroughUpdates.push({ id: root.id, date: lastOccurrenceDate });
  }
  if (inserts.length) {
    const { error } = await supabase.from("tasks").upsert(inserts, {
      onConflict: "user_id,recurrence_source_id,recurrence_date",
      ignoreDuplicates: true,
    });
    if (error) throw new Error("반복 업무를 생성하지 못했습니다.");
  }
  for (const update of generatedThroughUpdates) {
    const { error } = await supabase
      .from("tasks")
      .update({ recurrence_generated_through: update.date })
      .eq("id", update.id)
      .eq("user_id", userId);
    if (error) throw new Error("반복 업무 생성 상태를 저장하지 못했습니다.");
  }
}

export async function ensureRecurringEvents(throughDate: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { data: roots, error: rootsError } = await supabase.from("events").select("*")
    .eq("user_id", userId).is("recurrence_source_id", null)
    .not("recurrence_frequency", "is", null).lte("recurrence_date", throughDate);
  if (rootsError) throw new Error("반복 일정을 확인하지 못했습니다.");
  const inserts: DatabaseEventInsert[] = [];
  const updates: Array<{ id: string; date: string }> = [];
  for (const root of roots) {
    if (!root.recurrence_frequency || !root.recurrence_date) continue;
    const anchor = root.recurrence_generated_through ?? root.recurrence_date;
    const dates = occurrenceDatesThrough(anchor, throughDate, root.recurrence_frequency);
    for (const occurrenceDate of dates) {
      inserts.push({
        user_id: userId, title: root.title, area: root.area,
        start_date: occurrenceDate,
        end_date: shiftFromAnchor(root.recurrence_date, root.end_date, occurrenceDate) ?? occurrenceDate,
        is_all_day: root.is_all_day, start_time: root.start_time, end_time: root.end_time,
        location: root.location ?? null, color_key: root.color_key ?? null, memo: root.memo, description: root.description,
        recurrence_frequency: root.recurrence_frequency, recurrence_source_id: root.id,
        recurrence_date: occurrenceDate, recurrence_generated_through: null,
      });
    }
    const last = dates.at(-1);
    if (last) updates.push({ id: root.id, date: last });
  }
  if (inserts.length) {
    const { error } = await supabase.from("events").upsert(inserts, { onConflict: "user_id,recurrence_source_id,recurrence_date", ignoreDuplicates: true });
    if (error) throw new Error("반복 일정을 생성하지 못했습니다.");
  }
  for (const update of updates) {
    const { error } = await supabase.from("events").update({ recurrence_generated_through: update.date }).eq("id", update.id).eq("user_id", userId);
    if (error) throw new Error("반복 일정 생성 상태를 저장하지 못했습니다.");
  }
}

export async function saveEvent(values: Omit<EventRow, "id" | "user_id" | "created_at" | "updated_at">, id?: string): Promise<string> {
  const { supabase, userId } = await ownedClient();
  if (id) {
    const { error } = await supabase.from("events").update(values).eq("id", id).eq("user_id", userId);
    if (error) throw new Error("일정을 저장하지 못했습니다.");
    return id;
  }
  const { data, error } = await supabase.from("events").insert({ ...values, user_id: userId }).select("id").single();
  if (error) throw new Error("일정을 저장하지 못했습니다.");
  return data.id;
}

export async function removeWorkItem(table: "tasks" | "events", id: string) {
  const { supabase, userId } = await ownedClient();
  const query = table === "tasks" ? supabase.from("tasks") : supabase.from("events");
  const { error } = await query.delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error("항목을 삭제하지 못했습니다.");
}

export async function setTaskCompleted(id: string, completed: boolean) {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("tasks").update({
    status: completed ? "completed" : "planned",
    completed_at: completed ? new Date().toISOString() : null,
  }).eq("id", id).eq("user_id", userId);
  if (error) throw new Error("완료 상태를 변경하지 못했습니다.");
}

export async function moveCalendarItem(kind: CalendarItemKind, id: string, newDate: string, scope: CalendarMoveScope): Promise<void> {
  const { supabase } = await ownedClient();
  const { error } = await supabase.rpc("move_calendar_item", {
    p_kind: kind,
    p_item_id: id,
    p_new_date: newDate,
    p_scope: scope,
  });
  if (error) throw new Error("날짜를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.");
}

export async function moveCalendarEventTime(id: string, date: string, startTime: string, endTime: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("events").update({ start_date: date, end_date: date, is_all_day: false, start_time: startTime, end_time: endTime }).eq("id", id).eq("user_id", userId);
  if (error) throw new Error("일정 시간을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.");
}
