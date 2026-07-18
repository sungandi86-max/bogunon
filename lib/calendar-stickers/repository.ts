import { calendarStickerRangeSchema } from "@/lib/calendar-stickers/dates";
import { createClient } from "@/lib/supabase/server";
import type { CalendarStickerKey } from "@/lib/calendar-stickers/catalog";
import type { CalendarStickerRow } from "@/types/database";

export type CalendarStickerWriteValues = {
  readonly stickerKey: CalendarStickerKey;
  readonly stickerDate: string;
  readonly endDate: string | null;
  readonly label: string;
  readonly note: string | null;
};

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

function checkedRange(stickerDate: string, endDate: string | null): { readonly stickerDate: string; readonly endDate: string | null } {
  return calendarStickerRangeSchema.parse({ stickerDate, endDate });
}

function insertValues(userId: string, values: CalendarStickerWriteValues) {
  const range = checkedRange(values.stickerDate, values.endDate);
  return {
    user_id: userId,
    sticker_key: values.stickerKey,
    sticker_date: range.stickerDate,
    end_date: range.endDate,
    label: values.label,
    note: values.note,
  };
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

export async function createCalendarSticker(values: CalendarStickerWriteValues): Promise<CalendarStickerRow> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("calendar_stickers")
    .insert(insertValues(userId, values))
    .select("*")
    .single();
  if (error) throw new Error(error.code === "23505" ? "이미 이 날짜에 붙인 스티커입니다." : "학교 일정 스티커를 저장하지 못했습니다.");
  return data;
}

export async function upsertCalendarSticker(values: CalendarStickerWriteValues): Promise<CalendarStickerRow> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase
    .from("calendar_stickers")
    .upsert(insertValues(userId, values), { onConflict: "user_id,sticker_date,sticker_key" })
    .select("*")
    .single();
  if (error) throw new Error("학교 일정 스티커를 저장하지 못했습니다.");
  return data;
}

export async function deleteCalendarSticker(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("calendar_stickers").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error("학교 일정 스티커를 제거하지 못했습니다.");
}
