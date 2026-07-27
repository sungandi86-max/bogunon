import { createClient } from "@/lib/supabase/server";
import type {
  ReservationDeleteInput,
  ReservationInput,
} from "@/lib/projects/reservations";
import type { ProjectReservationRow } from "@/types/database";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listProjectReservations(projectId: string): Promise<ProjectReservationRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("project_reservations")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("reservation_date")
    .order("start_time")
    .order("created_at");
  if (error) throw new Error("예약을 불러오지 못했습니다.");
  return data;
}

export async function saveProjectReservation(input: ReservationInput): Promise<string> {
  const { supabase } = await ownedClient();
  const values = {
    project_id: input.projectId,
    type: input.type,
    title: input.title,
    reservation_date: input.reservationDate,
    start_time: input.startTime,
    end_time: input.endTime,
    company: input.company,
    confirmation_number: input.confirmationNumber,
    location: input.location,
    phone: input.phone,
    website: input.website,
    memo: input.memo,
  };
  const { data, error } = await supabase.rpc("save_project_reservation", {
    p_reservation_id: input.reservationId ?? null,
    p_values: values,
    p_sync_calendar: input.syncCalendar,
  });
  if (error) throw new Error("예약을 저장하지 못했습니다.");
  return data;
}

export async function deleteProjectReservation(input: ReservationDeleteInput): Promise<void> {
  const { supabase } = await ownedClient();
  const { error } = await supabase.rpc("delete_project_reservation", {
    p_reservation_id: input.reservationId,
    p_delete_linked_event: input.deleteLinkedEvent,
  });
  if (error) throw new Error("예약을 삭제하지 못했습니다.");
}
