import { createClient } from "@/lib/supabase/server";
import type {
  ChecklistItemTarget,
  ChecklistProjectTarget,
  CreateChecklistItemInput,
  ReorderChecklistItemsInput,
  UpdateChecklistItemInput,
} from "@/lib/projects/checklist";
import type { ProjectChecklistItemRow } from "@/types/database";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listProjectChecklistItems(projectId: string): Promise<ProjectChecklistItemRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("project_checklist_items")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error("체크리스트를 불러오지 못했습니다.");
  return data;
}

export async function createProjectChecklistItem(
  input: CreateChecklistItemInput,
): Promise<ProjectChecklistItemRow> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("project_checklist_items")
    .insert({
      user_id: userId,
      project_id: input.projectId,
      title: input.title,
      due_date: input.dueDate,
    })
    .select("*")
    .single();
  if (error) throw new Error("체크리스트 항목을 추가하지 못했습니다.");
  return data;
}

export async function updateProjectChecklistItem(
  input: UpdateChecklistItemInput,
): Promise<ProjectChecklistItemRow> {
  const { supabase, userId } = await ownedClient();
  const values = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.isCompleted !== undefined ? { is_completed: input.isCompleted } : {}),
    ...(input.dueDate !== undefined ? { due_date: input.dueDate } : {}),
  };
  const { data, error } = await supabase
    .from("project_checklist_items")
    .update(values)
    .eq("id", input.itemId)
    .eq("project_id", input.projectId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("체크리스트 항목을 수정하지 못했습니다.");
  return data;
}

export async function deleteProjectChecklistItem(input: ChecklistItemTarget): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase
    .from("project_checklist_items")
    .delete()
    .eq("id", input.itemId)
    .eq("project_id", input.projectId)
    .eq("user_id", userId);
  if (error) throw new Error("체크리스트 항목을 삭제하지 못했습니다.");
}

export async function deleteCompletedProjectChecklistItems(
  input: ChecklistProjectTarget,
): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase
    .from("project_checklist_items")
    .delete()
    .eq("project_id", input.projectId)
    .eq("user_id", userId)
    .eq("is_completed", true);
  if (error) throw new Error("완료 항목을 삭제하지 못했습니다.");
}

export async function reorderProjectChecklistItems(
  input: ReorderChecklistItemsInput,
): Promise<void> {
  const { supabase } = await ownedClient();
  const { error } = await supabase.rpc("reorder_project_checklist_items", {
    p_project_id: input.projectId,
    p_item_ids: input.itemIds,
  });
  if (error) throw new Error("체크리스트 순서를 저장하지 못했습니다.");
}
