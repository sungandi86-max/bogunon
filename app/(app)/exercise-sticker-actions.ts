"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { removeCustomExerciseSticker, removeExerciseLog, saveCustomExerciseSticker, saveExerciseLog, updateExerciseLog } from "@/lib/exercise/repository";

export type StickerActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const idSchema = z.string().uuid();
const colorSchema = z.enum(["mint", "pink", "yellow", "coral", "blue", "lavender", "sky", "aqua", "cream"]);
const iconSchema = z.enum(["badminton", "badminton_lesson", "walking", "running", "strength", "stretching", "cycling", "swimming", "other"]);

function refreshExercise(): void {
  revalidatePath("/exercise");
  revalidatePath("/briefing");
}

export async function attachExerciseStickerAction(_state: StickerActionState, formData: FormData): Promise<StickerActionState> {
  const stickerId = idSchema.safeParse(String(formData.get("stickerId") ?? ""));
  const date = dateSchema.safeParse(String(formData.get("exerciseDate") ?? ""));
  if (!stickerId.success || !date.success) return { status: "error", message: "날짜와 운동 스티커를 확인해 주세요." };
  try {
    const result = await saveExerciseLog(stickerId.data, date.data);
    refreshExercise();
    return result === "duplicate"
      ? { status: "success", message: "이미 붙인 운동 스티커예요." }
      : { status: "success", message: "운동 스티커를 붙였어요." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "운동 스티커를 저장하지 못했습니다." };
  }
}

export async function removeExerciseStickerAction(_state: StickerActionState, formData: FormData): Promise<StickerActionState> {
  const id = idSchema.safeParse(String(formData.get("logId") ?? ""));
  if (!id.success) return { status: "error", message: "운동 기록을 확인해 주세요." };
  try {
    await removeExerciseLog(id.data);
    refreshExercise();
    return { status: "success", message: "운동 스티커를 떼었어요." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "운동 스티커를 제거하지 못했습니다." };
  }
}

export async function updateExerciseStickerDetailsAction(_state: StickerActionState, formData: FormData): Promise<StickerActionState> {
  const id = idSchema.safeParse(String(formData.get("logId") ?? ""));
  const durationText = String(formData.get("durationMinutes") ?? "").trim();
  const duration = durationText ? Number(durationText) : null;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!id.success || (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) || (note?.length ?? 0) > 500) return { status: "error", message: "운동 시간과 메모를 확인해 주세요." };
  try {
    await updateExerciseLog(id.data, duration, note);
    refreshExercise();
    return { status: "success", message: "운동 기록을 저장했어요." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "운동 기록을 수정하지 못했습니다." };
  }
}

export async function saveCustomExerciseStickerAction(_state: StickerActionState, formData: FormData): Promise<StickerActionState> {
  const idText = String(formData.get("id") ?? "").trim();
  const id = idText ? idSchema.safeParse(idText) : null;
  const label = String(formData.get("label") ?? "").trim();
  const icon = iconSchema.safeParse(String(formData.get("iconKey") ?? ""));
  const color = colorSchema.safeParse(String(formData.get("colorKey") ?? ""));
  if ((id && !id.success) || !label || label.length > 30 || !icon.success || !color.success) return { status: "error", message: "스티커 이름과 모양을 확인해 주세요." };
  try {
    await saveCustomExerciseSticker({ ...(id?.success ? { id: id.data } : {}), label, iconKey: icon.data, colorKey: color.data });
    refreshExercise();
    return { status: "success", message: id ? "내 스티커를 수정했어요." : "내 스티커를 만들었어요." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "내 스티커를 저장하지 못했습니다." };
  }
}

export async function removeCustomExerciseStickerAction(_state: StickerActionState, formData: FormData): Promise<StickerActionState> {
  const id = idSchema.safeParse(String(formData.get("id") ?? ""));
  if (!id.success) return { status: "error", message: "스티커를 확인해 주세요." };
  try {
    await removeCustomExerciseSticker(id.data);
    refreshExercise();
    return { status: "success", message: "내 스티커를 삭제했어요." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "내 스티커를 삭제하지 못했습니다." };
  }
}
