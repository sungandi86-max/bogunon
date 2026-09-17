import { createClient } from "@/lib/supabase/server";
import type { Database, PracticalScheduleToolRow, PracticalToolRow } from "@/types/database";

export type PracticalTool = PracticalToolRow;
export type PracticalScheduleTool = PracticalScheduleToolRow;

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listPracticalTools(): Promise<PracticalTool[]> {
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.from("practical_tools").select("*").eq("is_active", true).order("scope").order("name");
  if (error) throw new Error("관련 도구를 불러오지 못했습니다.");
  return data;
}

export async function listScheduleToolLinks(scheduleIds: readonly string[]): Promise<PracticalScheduleTool[]> {
  if (scheduleIds.length === 0) return [];
  const { supabase } = await ownedClient();
  const { data, error } = await supabase.from("practical_schedule_tools").select("*").in("schedule_id", scheduleIds);
  if (error) throw new Error("일정 도구 연결을 불러오지 못했습니다.");
  return data;
}

export async function createPracticalTool(userId: string, values: Omit<PracticalToolRow, "id" | "created_at" | "updated_at" | "owner_id" | "scope">): Promise<void> {
  const { supabase } = await ownedClient();
  const insert: Database["public"]["Tables"]["practical_tools"]["Insert"] = { ...values, owner_id: userId, scope: "personal" };
  const { error } = await supabase.from("practical_tools").insert(insert);
  if (error) throw new Error("내 도구를 저장하지 못했습니다.");
}

export async function updatePracticalTool(id: string, values: Pick<PracticalToolRow, "name" | "description" | "url" | "icon_key" | "is_active">): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("practical_tools").update(values).eq("id", id).eq("owner_id", userId);
  if (error) throw new Error("내 도구를 수정하지 못했습니다.");
}

export async function deletePracticalTool(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("practical_tools").delete().eq("id", id).eq("owner_id", userId);
  if (error) throw new Error("내 도구를 삭제하지 못했습니다.");
}

export async function attachToolToSchedule(scheduleId: string, toolId: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("practical_schedule_tools").upsert({ user_id: userId, schedule_id: scheduleId, tool_id: toolId }, { onConflict: "schedule_id,tool_id", ignoreDuplicates: true });
  if (error) throw new Error("관련 도구를 연결하지 못했습니다.");
}

export async function detachToolFromSchedule(scheduleId: string, toolId: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("practical_schedule_tools").delete().eq("user_id", userId).eq("schedule_id", scheduleId).eq("tool_id", toolId);
  if (error) throw new Error("관련 도구 연결을 해제하지 못했습니다.");
}
