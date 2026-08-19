import { createClient } from "@/lib/supabase/server";
import type { UserQuickLinkRow } from "@/types/database";

export type QuickLink = { readonly id: string; readonly userId: string; readonly name: string; readonly url: string; readonly iconKey: UserQuickLinkRow["icon_key"]; readonly sortOrder: number; readonly isVisible: boolean; readonly createdAt: string; readonly updatedAt: string };

export class QuickLinkRepositoryError extends Error { readonly name = "QuickLinkRepositoryError"; }

function mapLink(row: UserQuickLinkRow): QuickLink { return { id: row.id, userId: row.user_id, name: row.name, url: row.url, iconKey: row.icon_key, sortOrder: row.sort_order, isVisible: row.is_visible, createdAt: row.created_at, updatedAt: row.updated_at }; }

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new QuickLinkRepositoryError("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listQuickLinks(visibleOnly = false): Promise<QuickLink[]> {
  const { supabase, userId } = await ownedClient();
  let query = supabase.from("user_quick_links").select("*").eq("user_id", userId).order("sort_order").order("created_at");
  if (visibleOnly) query = query.eq("is_visible", true);
  const { data, error } = await query;
  if (error) throw new QuickLinkRepositoryError("자주 쓰는 링크를 불러오지 못했습니다.");
  return data.map(mapLink);
}

export async function createQuickLink(userId: string, values: Omit<QuickLink, "id" | "userId" | "createdAt" | "updatedAt">): Promise<void> {
  const { supabase } = await ownedClient();
  const { error } = await supabase.from("user_quick_links").insert({ user_id: userId, name: values.name, url: values.url, icon_key: values.iconKey, sort_order: values.sortOrder, is_visible: values.isVisible });
  if (error) throw new QuickLinkRepositoryError("링크를 저장하지 못했습니다.");
}

export async function updateQuickLink(id: string, values: Omit<QuickLink, "id" | "userId" | "createdAt" | "updatedAt">): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("user_quick_links").update({ name: values.name, url: values.url, icon_key: values.iconKey, sort_order: values.sortOrder, is_visible: values.isVisible }).eq("id", id).eq("user_id", userId);
  if (error) throw new QuickLinkRepositoryError("링크를 수정하지 못했습니다.");
}

export async function deleteQuickLink(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("user_quick_links").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new QuickLinkRepositoryError("링크를 삭제하지 못했습니다.");
}
