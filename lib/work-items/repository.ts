import { createClient } from "@/lib/supabase/server";
import type { EventRow, TaskRow } from "@/types/database";

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

export async function saveTask(values: Omit<TaskRow, "id" | "user_id" | "created_at" | "updated_at">, id?: string) {
  const { supabase, userId } = await ownedClient();
  const query = id
    ? supabase.from("tasks").update(values).eq("id", id).eq("user_id", userId)
    : supabase.from("tasks").insert({ ...values, user_id: userId });
  const { error } = await query;
  if (error) throw new Error("업무를 저장하지 못했습니다.");
}

export async function saveEvent(values: Omit<EventRow, "id" | "user_id" | "created_at" | "updated_at">, id?: string) {
  const { supabase, userId } = await ownedClient();
  const query = id
    ? supabase.from("events").update(values).eq("id", id).eq("user_id", userId)
    : supabase.from("events").insert({ ...values, user_id: userId });
  const { error } = await query;
  if (error) throw new Error("일정을 저장하지 못했습니다.");
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
