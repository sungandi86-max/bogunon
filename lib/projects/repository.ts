import { createClient } from "@/lib/supabase/server";
import type { EventRow, ProjectRow } from "@/types/database";
import type { ProjectInput } from "@/lib/projects/domain";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listProjects(): Promise<ProjectRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error("프로젝트를 불러오지 못했습니다.");
  return data;
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("프로젝트를 불러오지 못했습니다.");
  return data;
}

export async function listProjectEvents(projectId: string): Promise<EventRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("start_date")
    .order("start_time");
  if (error) throw new Error("프로젝트 일정을 불러오지 못했습니다.");
  return data;
}

export async function saveProject(values: ProjectInput, id?: string): Promise<string> {
  const { supabase, userId } = await ownedClient();
  if (id) {
    const { data, error } = await supabase
      .from("projects")
      .update(values)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error) throw new Error("프로젝트를 저장하지 못했습니다.");
    return data.id;
  }
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...values, user_id: userId })
    .select("id")
    .single();
  if (error) throw new Error("프로젝트를 저장하지 못했습니다.");
  return data.id;
}

export async function deleteProject(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error("프로젝트를 삭제하지 못했습니다.");
}
