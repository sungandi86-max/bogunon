import type { ProjectNoteInput, ProjectNoteTarget } from "@/lib/projects/notes";
import { createClient } from "@/lib/supabase/server";
import type { ProjectNoteRow } from "@/types/database";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listProjectNotes(projectId: string): Promise<ProjectNoteRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("project_notes")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw new Error("노트를 불러오지 못했습니다.");
  return data;
}

export async function saveProjectNote(input: ProjectNoteInput): Promise<ProjectNoteRow> {
  const { supabase, userId } = await ownedClient();
  const values = {
    content: input.content,
    is_pinned: input.isPinned,
    title: input.title,
  };
  const query = input.noteId
    ? supabase
      .from("project_notes")
      .update(values)
      .eq("id", input.noteId)
      .eq("project_id", input.projectId)
      .eq("user_id", userId)
    : supabase.from("project_notes").insert({
      ...values,
      project_id: input.projectId,
      user_id: userId,
    });
  const { data, error } = await query.select("*").single();
  if (error) throw new Error("노트를 저장하지 못했습니다.");
  return data;
}

export async function deleteProjectNote(input: ProjectNoteTarget): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase
    .from("project_notes")
    .delete()
    .eq("id", input.noteId)
    .eq("project_id", input.projectId)
    .eq("user_id", userId);
  if (error) throw new Error("노트를 삭제하지 못했습니다.");
}
