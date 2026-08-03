"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { deleteCalendarSticker } from "@/lib/calendar-stickers/repository";

export type CalendarStickerActionState = {
  readonly status: "idle" | "success" | "error";
  readonly message?: string;
};

const idSchema = z.string().uuid();

function refreshCalendarStickerViews(): void {
  revalidatePath("/calendar");
  revalidatePath("/briefing");
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
