import { calendarStickerRangeSchema } from "@/lib/calendar-stickers/dates";
import { createClient } from "@/lib/supabase/server";
import type { CalendarStickerRow } from "@/types/database";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export async function listCalendarStickers(first: string, last: string): Promise<CalendarStickerRow[]> {
  const range = calendarStickerRangeSchema.parse({ stickerDate: first, endDate: last });
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("calendar_stickers")
    .select("*")
    .eq("user_id", userId)
    .lte("sticker_date", range.endDate ?? range.stickerDate)
    .or(`end_date.is.null,end_date.gte.${range.stickerDate}`)
    .order("sticker_date")
    .order("created_at");
  if (error) throw new Error("학교 일정 스티커를 불러오지 못했습니다.");
  return data;
}

export async function listAllCalendarStickers(): Promise<CalendarStickerRow[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("calendar_stickers").select("*").eq("user_id", userId).order("sticker_date");
  if (error) throw new Error("학교 일정 스티커를 불러오지 못했습니다.");
  return data;
}

export async function deleteCalendarSticker(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("calendar_stickers").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error("학교 일정 스티커를 제거하지 못했습니다.");
}
