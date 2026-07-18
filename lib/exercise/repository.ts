import { createClient } from "@/lib/supabase/server";
import type { ExerciseLogRow, ExerciseStickerColorKey, ExerciseStickerIconKey, ExerciseStickerRow } from "@/types/database";

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export interface ExerciseStickerData {
  readonly stickers: ExerciseStickerRow[];
  readonly logs: ExerciseLogRow[];
}

export async function listExerciseStickerData(first: string, last: string): Promise<ExerciseStickerData> {
  const { supabase, userId } = await ownedClient();
  const [stickersResult, logsResult] = await Promise.all([
    supabase.from("exercise_stickers").select("*").order("display_order").order("created_at"),
    supabase.from("exercise_logs").select("*").eq("user_id", userId).gte("exercise_date", first).lte("exercise_date", last).order("exercise_date"),
  ]);
  if (stickersResult.error || logsResult.error) throw new Error("운동 스티커를 불러오지 못했습니다.");
  return { stickers: stickersResult.data, logs: logsResult.data };
}

export async function saveExerciseLog(stickerId: string, exerciseDate: string): Promise<"created" | "duplicate"> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("exercise_logs").insert({ user_id: userId, sticker_id: stickerId, exercise_date: exerciseDate });
  if (!error) return "created";
  if (error.code === "23505") return "duplicate";
  throw new Error("운동 스티커를 저장하지 못했습니다.");
}

export async function removeExerciseLog(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("exercise_logs").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error("운동 스티커를 제거하지 못했습니다.");
}

export async function updateExerciseLog(id: string, durationMinutes: number | null, note: string | null): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("exercise_logs").update({ duration_minutes: durationMinutes, note }).eq("id", id).eq("user_id", userId);
  if (error) throw new Error("운동 기록을 수정하지 못했습니다.");
}

export async function saveCustomExerciseSticker(values: { readonly id?: string; readonly label: string; readonly iconKey: ExerciseStickerIconKey; readonly colorKey: ExerciseStickerColorKey }): Promise<void> {
  const { supabase, userId } = await ownedClient();
  if (values.id) {
    const { error } = await supabase.from("exercise_stickers").update({ label: values.label, icon_key: values.iconKey, color_key: values.colorKey }).eq("id", values.id).eq("user_id", userId).eq("is_default", false);
    if (error) throw new Error("내 스티커를 수정하지 못했습니다.");
    return;
  }
  const { error } = await supabase.from("exercise_stickers").insert({ user_id: userId, label: values.label, icon_key: values.iconKey, color_key: values.colorKey, is_default: false });
  if (error) throw new Error(error.code === "23505" ? "같은 이름의 스티커가 이미 있습니다." : "내 스티커를 만들지 못했습니다.");
}

export async function removeCustomExerciseSticker(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("exercise_stickers").delete().eq("id", id).eq("user_id", userId).eq("is_default", false);
  if (error) throw new Error(error.code === "23503" ? "기록에 사용한 스티커는 먼저 기록을 제거해 주세요." : "내 스티커를 삭제하지 못했습니다.");
}
