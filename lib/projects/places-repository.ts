import { createClient } from "@/lib/supabase/server";
import type { ProjectPlaceInput } from "@/lib/projects/places";
import type { ProjectPlaceRow } from "@/types/database";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listProjectPlaces(projectId: string): Promise<ProjectPlaceRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("project_places").select("*")
    .eq("user_id", userId).eq("project_id", projectId)
    .order("visited_date", { ascending: true, nullsFirst: false })
    .order("sort_order").order("visited_time", { ascending: true, nullsFirst: false });
  if (error) throw new Error("장소를 불러오지 못했습니다.");
  return data;
}

export async function saveProjectPlace(input: ProjectPlaceInput): Promise<ProjectPlaceRow> {
  const { supabase, userId } = await ownedClient();
  const values = {
    event_id: input.eventId,
    reservation_id: input.reservationId, name: input.name, address: input.address,
    latitude: input.latitude, longitude: input.longitude, visited_date: input.visitedDate,
    visited_time: input.visitedTime, category: input.category, memo: input.memo,
    is_visited: input.isVisited,
  };
  const [hours = 99, minutes = 59] = input.visitedTime?.split(":").map(Number) ?? [];
  const initialSortOrder = hours * 60 + minutes;
  const query = input.placeId
    ? supabase.from("project_places").update(values).eq("id", input.placeId).eq("user_id", userId).eq("project_id", input.projectId)
    : supabase.from("project_places").insert({ ...values, user_id: userId, project_id: input.projectId, sort_order: initialSortOrder });
  const { data, error } = await query.select("*").single();
  if (error) throw new Error("장소를 저장하지 못했습니다.");
  return data;
}

export async function deleteProjectPlace(projectId: string, placeId: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("project_places").delete()
    .eq("id", placeId).eq("project_id", projectId).eq("user_id", userId);
  if (error) throw new Error("장소를 삭제하지 못했습니다.");
}

export async function reorderProjectPlaces(projectId: string, placeIds: readonly string[]): Promise<void> {
  const { supabase } = await ownedClient();
  const { error } = await supabase.rpc("reorder_project_places", { p_project_id: projectId, p_place_ids: [...placeIds] });
  if (error) throw new Error("장소 순서를 저장하지 못했습니다.");
}

export async function updateProjectPlaceVisited(projectId: string, placeId: string, isVisited: boolean): Promise<ProjectPlaceRow> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("project_places").update({ is_visited: isVisited })
    .eq("id", placeId).eq("project_id", projectId).eq("user_id", userId).select("*").single();
  if (error) throw new Error("방문 상태를 저장하지 못했습니다.");
  return data;
}
