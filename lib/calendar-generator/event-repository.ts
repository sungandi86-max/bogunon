import { createClient } from "@/lib/supabase/server";
import type {
  SmartCalendarEventStore,
  SmartCalendarSaveItem,
} from "@/lib/calendar-generator/persistence";

export class SmartCalendarUnauthorizedError extends Error {
  constructor() {
    super("로그인이 필요합니다.");
    this.name = "SmartCalendarUnauthorizedError";
  }
}

export async function createSmartCalendarEventStore(): Promise<SmartCalendarEventStore> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new SmartCalendarUnauthorizedError();
  const userId = user.id;

  return {
    listExisting: async () => {
      const { data, error: listError } = await supabase
        .from("events")
        .select("id,title,start_date,end_date")
        .eq("user_id", userId);
      if (listError) throw new Error("기존 일정을 확인하지 못했습니다.");
      return data.map((event) => ({
        id: event.id,
        title: event.title,
        startDate: event.start_date,
        endDate: event.end_date,
      }));
    },
    insert: async (item) => insertEvent({ item, userId, supabase }),
  };
}

async function insertEvent(request: {
  readonly item: SmartCalendarSaveItem;
  readonly userId: string;
  readonly supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const { data, error } = await request.supabase.from("events").insert({
    user_id: request.userId,
    title: request.item.title,
    area: request.item.area,
    start_date: request.item.startDate,
    end_date: request.item.endDate,
    is_all_day: true,
    start_time: null,
    end_time: null,
    location: null,
    color_key: request.item.area === "healthWork" ? "mint" : "blue",
    memo: null,
    description: request.item.description,
    recurrence_frequency: null,
    recurrence_source_id: null,
    recurrence_date: null,
    recurrence_generated_through: null,
  }).select("id").single();
  return error
    ? { ok: false as const, message: "일정을 저장하지 못했습니다." }
    : { ok: true as const, eventId: data.id };
}
