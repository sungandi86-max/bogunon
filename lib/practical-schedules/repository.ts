import { createClient } from "@/lib/supabase/server";
import type { CalendarStickerKey } from "@/lib/calendar-stickers/catalog";
import type { Database, EventRow, PracticalScheduleCategory, PracticalScheduleRow } from "@/types/database";
import { isLinkablePracticalEvent, parsePracticalStickerKey, practicalScheduleCalendarDescription } from "@/lib/practical-schedules/domain";

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
  readonly stickerKey: CalendarStickerKey | null;
};

type ExistingEventFields = {
  readonly title: string;
  readonly start_date: string;
  readonly start_time: string | null;
  readonly end_time: string | null;
  readonly location: string | null | undefined;
  readonly sticker_key: CalendarStickerKey | null;
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

export async function listLinkableEvents(year: number, query = ""): Promise<EventRow[]> {
  const { supabase, userId } = await ownedClient();
  const first = `${year}-01-01`;
  const last = `${year}-12-31`;
  const { data, error } = await supabase.from("events").select("*").eq("user_id", userId)
    .is("practical_schedule_id", null)
    .is("recurrence_frequency", null)
    .is("recurrence_source_id", null)
    .lte("start_date", last)
    .gte("end_date", first)
    .order("start_date")
    .order("start_time");
  if (error) throw new Error("연결할 캘린더 일정을 불러오지 못했습니다.");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return data.filter(isLinkablePracticalEvent)
    .filter((event) => !normalizedQuery || event.title.toLocaleLowerCase().includes(normalizedQuery));
}

export async function listLinkedPracticalScheduleIds(): Promise<readonly string[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("events").select("practical_schedule_id").eq("user_id", userId).eq("practical_schedule_origin", "linked_existing").not("practical_schedule_id", "is", null);
  if (error) throw new Error("연결된 캘린더 일정을 확인하지 못했습니다.");
  return data.flatMap((event) => event.practical_schedule_id ? [event.practical_schedule_id] : []);
}

function eventValues(input: PracticalScheduleInput, userId: string, id: string): Database["public"]["Tables"]["events"]["Insert"] {
  const description = practicalScheduleCalendarDescription(input.method, input.notes);
  return {
    id, user_id: userId, title: input.title, area: "healthWork", start_date: input.scheduledDate ?? "2000-01-01", end_date: input.scheduledDate ?? "2000-01-01",
    is_all_day: !input.startTime, start_time: input.startTime, end_time: input.endTime, location: input.location, color_key: "mint",
    recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null, recurrence_generated_through: null,
    practical_schedule_id: id, practical_schedule_origin: "projected", sticker_key: input.stickerKey,
    memo: null, description: description || null,
  };
}

function scheduleValues(input: PracticalScheduleInput, canonical?: ExistingEventFields) {
  return {
    year: input.year,
    category: input.category,
    title: canonical?.title ?? input.title,
    scheduled_date: canonical?.start_date ?? input.scheduledDate,
    start_time: canonical?.start_time ?? input.startTime,
    end_time: canonical?.end_time ?? input.endTime,
    location: canonical?.location ?? input.location,
    method: input.method,
    notes: input.notes,
    url: input.url,
    annual_preset_key: input.annualPresetKey,
    sticker_key: canonical?.sticker_key ?? input.stickerKey,
  };
}

async function linkedEventForSchedule(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, scheduleId: string): Promise<EventRow | null> {
  const { data, error } = await supabase.from("events").select("*").eq("user_id", userId).eq("practical_schedule_id", scheduleId).maybeSingle();
  if (error) throw new Error("연결된 캘린더 일정을 확인하지 못했습니다.");
  return data;
}

async function syncProjectedEvent(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, scheduleId: string, input: PracticalScheduleInput): Promise<void> {
  const current = await linkedEventForSchedule(supabase, userId, scheduleId);
  if (current?.practical_schedule_origin === "linked_existing") return;
  if (!input.scheduledDate) {
    if (!current) return;
    const { error } = await supabase.from("events").delete().eq("id", current.id).eq("user_id", userId);
    if (error) throw new Error("연결된 캘린더 일정을 정리하지 못했습니다.");
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
  let canonical: ExistingEventFields | undefined;
  let linkedExisting = false;
  if (id) {
    const currentEvent = await linkedEventForSchedule(supabase, userId, id);
    if (currentEvent?.practical_schedule_origin === "linked_existing") {
      canonical = {
        title: currentEvent.title,
        start_date: currentEvent.start_date,
        start_time: currentEvent.start_time,
        end_time: currentEvent.end_time,
        location: currentEvent.location,
        sticker_key: parsePracticalStickerKey(currentEvent.sticker_key ?? null),
      };
      linkedExisting = true;
    }
    const { error } = await supabase.from("health_practical_schedules").update(scheduleValues(input, canonical)).eq("id", id).eq("user_id", userId);
    if (error) throw new Error("실무 일정을 저장하지 못했습니다.");
  } else {
    const { data, error } = await supabase.from("health_practical_schedules").insert({ user_id: userId, ...scheduleValues(input) } as Database["public"]["Tables"]["health_practical_schedules"]["Insert"]).select("id").single();
    if (error) throw new Error("실무 일정을 저장하지 못했습니다.");
    id = data.id;
  }
  if (!linkedExisting && id) await syncProjectedEvent(supabase, userId, id, input);
  if (!id) throw new Error("실무 일정 ID를 확인하지 못했습니다.");
  return id;
}

export async function linkExistingEvent(eventId: string, input: Omit<PracticalScheduleInput, "title" | "scheduledDate" | "startTime" | "endTime" | "location" | "stickerKey">): Promise<string> {
  const { supabase, userId } = await ownedClient();
  const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).eq("user_id", userId).maybeSingle();
  if (eventError || !event) throw new Error("연결할 캘린더 일정을 찾지 못했습니다.");
  if (!isLinkablePracticalEvent(event)) {
    throw new Error("이 일정은 실무 일정으로 연결할 수 없습니다.");
  }
  const values = scheduleValues({ ...input, title: event.title, scheduledDate: event.start_date, startTime: event.start_time, endTime: event.end_time, location: event.location ?? null, stickerKey: parsePracticalStickerKey(event.sticker_key ?? null) });
  const { data: schedule, error: scheduleError } = await supabase.from("health_practical_schedules").insert({ user_id: userId, ...values } as Database["public"]["Tables"]["health_practical_schedules"]["Insert"]).select("id").single();
  if (scheduleError) throw new Error("실무 일정을 저장하지 못했습니다.");
  try {
    const { data: linkedEvent, error } = await supabase.from("events").update({ practical_schedule_id: schedule.id, practical_schedule_origin: "linked_existing" }).eq("id", event.id).eq("user_id", userId).is("practical_schedule_id", null).select("id").maybeSingle();
    if (error || !linkedEvent) throw new Error("기존 캘린더 일정에 연결하지 못했습니다.");
  } catch (error) {
    await supabase.from("health_practical_schedules").delete().eq("id", schedule.id).eq("user_id", userId);
    throw error;
  }
  return schedule.id;
}

export async function removePracticalSchedule(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const linkedEvent = await linkedEventForSchedule(supabase, userId, id);
  if (linkedEvent?.practical_schedule_origin === "linked_existing") {
    const { error } = await supabase.from("events").update({ practical_schedule_id: null, practical_schedule_origin: null }).eq("id", linkedEvent.id).eq("user_id", userId);
    if (error) throw new Error("기존 캘린더 일정 연결을 해제하지 못했습니다.");
  } else if (linkedEvent) {
    const { error } = await supabase.from("events").delete().eq("id", linkedEvent.id).eq("user_id", userId);
    if (error) throw new Error("연결된 캘린더 일정을 삭제하지 못했습니다.");
  }
  const { error } = await supabase.from("health_practical_schedules").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error("실무 일정을 삭제하지 못했습니다.");
}
