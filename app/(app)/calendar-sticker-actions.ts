"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import { calendarStickerRangeSchema } from "@/lib/calendar-stickers/dates";
import { deleteCalendarSticker, upsertCalendarSticker } from "@/lib/calendar-stickers/repository";

export type CalendarStickerActionState = {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
};

const idSchema = z.string().uuid();
const noteSchema = z.string().trim().max(500);

function refreshCalendarStickerViews(): void {
  revalidatePath("/calendar");
  revalidatePath("/briefing");
}

export async function attachCalendarStickerAction(
  _state: CalendarStickerActionState,
  formData: FormData,
): Promise<CalendarStickerActionState> {
  const sticker = calendarStickerByKey(String(formData.get("stickerKey") ?? ""));
  const stickerDate = String(formData.get("stickerDate") ?? "");
  const endDateText = String(formData.get("endDate") ?? "").trim();
  const range = calendarStickerRangeSchema.safeParse({ stickerDate, endDate: endDateText || null });
  const note = noteSchema.safeParse(String(formData.get("note") ?? ""));
  if (!sticker || !range.success || !note.success) {
    return { status: "error", message: "스티커와 날짜를 확인해 주세요." };
  }

  try {
    await upsertCalendarSticker({
      stickerKey: sticker.key,
      stickerDate: range.data.stickerDate,
      endDate: range.data.endDate,
      label: sticker.label,
      note: note.data || null,
    });
    refreshCalendarStickerViews();
    return { status: "success", message: `${sticker.label} 스티커를 붙였어요.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "학교 일정 스티커를 저장하지 못했습니다." };
  }
}

export async function removeCalendarStickerAction(
  _state: CalendarStickerActionState,
  formData: FormData,
): Promise<CalendarStickerActionState> {
  const id = idSchema.safeParse(String(formData.get("stickerId") ?? ""));
  if (!id.success) return { status: "error", message: "제거할 스티커를 확인해 주세요." };

  try {
    await deleteCalendarSticker(id.data);
    refreshCalendarStickerViews();
    return { status: "success", message: "학교 일정 스티커를 제거했어요." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "학교 일정 스티커를 제거하지 못했습니다." };
  }
}
