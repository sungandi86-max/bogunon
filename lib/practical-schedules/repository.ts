import { createClient } from "@/lib/supabase/server";
import type { Database, EventRow, PracticalScheduleCategory, PracticalScheduleRow } from "@/types/database";
import { practicalScheduleCalendarDescription } from "@/lib/practical-schedules/domain";

export type PracticalScheduleInput = {
  readonly year: number;
  readonly category: PracticalScheduleCategory;
  readonly title: string;
  readonly scheduledDate: string | null;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly location: string | null;
  readonly method: string | null;
  readonly notes: string | null;
  readonly url: string | null;
  readonly annualPresetKey: string | null;
};

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listPracticalSchedules(year: number): Promise<PracticalScheduleRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("health_practical_schedules").select("*").eq("user_id", userId).eq("year", year).order("scheduled_date", { ascending: true, nullsFirst: true }).order("created_at");
  if (error) throw new Error("실무 일정을 불러오지 못했습니다.");
  return data;
}

function eventValues(input: PracticalScheduleInput, userId: string, id: string): Omit<EventRow, "created_at" | "updated_at"> {
  const description = practicalScheduleCalendarDescription(input.method, input.notes);
  return {
    id, user_id: userId, title: input.title, area: "healthWork", start_date: input.scheduledDate ?? "2000-01-01", end_date: input.scheduledDate ?? "2000-01-01",
    is_all_day: !input.startTime, start_time: input.startTime, end_time: input.endTime, location: input.location, color_key: "mint",
    recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null, recurrence_generated_through: null,
    practical_schedule_id: id, memo: null, description: description || null,
  };
}

async function syncCalendarEvent(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, scheduleId: string, input: PracticalScheduleInput) {
  const { data: current, error: findError } = await supabase.from("events").select("id").eq("user_id", userId).eq("practical_schedule_id", scheduleId).maybeSingle();
  if (findError) throw new Error("연결된 캘린더 일정을 확인하지 못했습니다.");
  if (!input.scheduledDate) {
    if (current) {
      const { error } = await supabase.from("events").delete().eq("id", current.id).eq("user_id", userId);
      if (error) throw new Error("연결된 캘린더 일정을 정리하지 못했습니다.");
    }
    return;
  }
  const values = eventValues(input, userId, scheduleId);
  if (current) {
    const { error } = await supabase.from("events").update(values).eq("id", current.id).eq("user_id", userId);
    if (error) throw new Error("캘린더 일정을 갱신하지 못했습니다.");
    return;
  }
  const { error } = await supabase.from("events").insert(values);
  if (error) throw new Error("캘린더 일정을 연결하지 못했습니다.");
}

export async function savePracticalSchedule(input: PracticalScheduleInput, id?: string): Promise<string> {
  const { supabase, userId } = await ownedClient();
  const values = {
    user_id: userId, year: input.year, category: input.category, title: input.title, scheduled_date: input.scheduledDate,
    start_time: input.startTime, end_time: input.endTime, location: input.location, method: input.method, notes: input.notes,
    url: input.url, annual_preset_key: input.annualPresetKey,
  };
  const updateValues = {
    year: input.year, category: input.category, title: input.title, scheduled_date: input.scheduledDate,
    start_time: input.startTime, end_time: input.endTime, location: input.location, method: input.method, notes: input.notes,
    url: input.url, annual_preset_key: input.annualPresetKey,
  };
  let scheduleId = id;
  if (id) {
    const { error } = await supabase.from("health_practical_schedules").update(updateValues).eq("id", id).eq("user_id", userId);
    if (error) throw new Error("실무 일정을 저장하지 못했습니다.");
  } else {
    const { data, error } = await supabase.from("health_practical_schedules").insert(values as Database["public"]["Tables"]["health_practical_schedules"]["Insert"]).select("id").single();
    if (error) throw new Error("실무 일정을 저장하지 못했습니다.");
    scheduleId = data.id;
  }
  await syncCalendarEvent(supabase, userId, scheduleId!, input);
  return scheduleId!;
}

export async function removePracticalSchedule(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("health_practical_schedules").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error("실무 일정을 삭제하지 못했습니다.");
}
