import { createClient } from "@/lib/supabase/server";
import type {
  ExerciseCompetitionReviewRow,
  ExerciseLessonReviewRow,
  ExerciseLogRow,
  ExerciseRecordType,
  ExerciseStickerColorKey,
  ExerciseStickerIconKey,
  ExerciseStickerRow,
} from "@/types/database";

export class ExerciseRepositoryError extends Error {
  readonly name = "ExerciseRepositoryError";
}

async function ownedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ExerciseRepositoryError("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

export type ExerciseLogWithReview = ExerciseLogRow & {
  readonly lessonReview: ExerciseLessonReviewRow | null;
  readonly competitionReview: ExerciseCompetitionReviewRow | null;
};

export type ExerciseStickerData = {
  readonly stickers: ExerciseStickerRow[];
  readonly logs: ExerciseLogWithReview[];
};

async function hydrateReviews(
  supabase: Awaited<ReturnType<typeof createClient>>,
  logs: readonly ExerciseLogRow[],
): Promise<ExerciseLogWithReview[]> {
  if (logs.length === 0) return [];
  const ids = logs.map((log) => log.id);
  const [lessons, competitions] = await Promise.all([
    supabase.from("exercise_lesson_reviews").select("*").in("exercise_log_id", ids),
    supabase.from("exercise_competition_reviews").select("*").in("exercise_log_id", ids),
  ]);
  if (lessons.error || competitions.error) throw new ExerciseRepositoryError("운동 리뷰를 불러오지 못했습니다.");
  const lessonById = new Map(lessons.data.map((review) => [review.exercise_log_id, review]));
  const competitionById = new Map(competitions.data.map((review) => [review.exercise_log_id, review]));
  return logs.map((log) => ({
    ...log,
    lessonReview: lessonById.get(log.id) ?? null,
    competitionReview: competitionById.get(log.id) ?? null,
  }));
}

export async function listExerciseStickerData(first: string, last: string): Promise<ExerciseStickerData> {
  const { supabase, userId } = await ownedClient();
  const [stickersResult, logsResult] = await Promise.all([
    supabase.from("exercise_stickers").select("*").order("display_order").order("created_at"),
    supabase.from("exercise_logs").select("*").eq("user_id", userId).gte("exercise_date", first).lte("exercise_date", last).order("exercise_date"),
  ]);
  if (stickersResult.error || logsResult.error) throw new ExerciseRepositoryError("운동 기록을 불러오지 못했습니다.");
  return { stickers: stickersResult.data, logs: await hydrateReviews(supabase, logsResult.data) };
}

export async function listRecentExerciseLogs(limit = 5): Promise<ExerciseLogWithReview[]> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("exercise_logs").select("*").eq("user_id", userId).order("exercise_date", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new ExerciseRepositoryError("최근 운동 기록을 불러오지 못했습니다.");
  return hydrateReviews(supabase, data);
}

export type SaveExerciseLogValues = {
  readonly eventId?: string | null;
  readonly stickerId: string;
  readonly exerciseDate: string;
  readonly recordType: ExerciseRecordType;
  readonly durationMinutes: number | null;
  readonly note: string | null;
};

export type SaveExerciseLogResult =
  | { readonly status: "created"; readonly log: { readonly id: string; readonly recordType: ExerciseRecordType } }
  | { readonly status: "duplicate" };

export async function saveExerciseLog(values: SaveExerciseLogValues): Promise<SaveExerciseLogResult> {
  const { supabase, userId } = await ownedClient();
  const { data, error } = await supabase.from("exercise_logs").insert({
    user_id: userId,
    ...(values.eventId ? { event_id: values.eventId } : {}),
    sticker_id: values.stickerId,
    exercise_date: values.exerciseDate,
    record_type: values.recordType,
    duration_minutes: values.durationMinutes,
    note: values.note,
  }).select("id, record_type").single();
  if (!error) return { status: "created", log: { id: data.id, recordType: data.record_type } };
  if (error.code === "23505") return { status: "duplicate" };
  throw new ExerciseRepositoryError("운동 기록을 저장하지 못했습니다.");
}

export async function removeExerciseLog(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("exercise_logs").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new ExerciseRepositoryError("운동 기록을 삭제하지 못했습니다.");
}

export async function updateExerciseLog(id: string, durationMinutes: number | null, note: string | null): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("exercise_logs").update({ duration_minutes: durationMinutes, note }).eq("id", id).eq("user_id", userId);
  if (error) throw new ExerciseRepositoryError("운동 기록을 수정하지 못했습니다.");
}

export async function saveCustomExerciseSticker(values: { readonly id?: string; readonly label: string; readonly iconKey: ExerciseStickerIconKey; readonly colorKey: ExerciseStickerColorKey }): Promise<void> {
  const { supabase, userId } = await ownedClient();
  if (values.id) {
    const { error } = await supabase.from("exercise_stickers").update({ label: values.label, icon_key: values.iconKey, color_key: values.colorKey }).eq("id", values.id).eq("user_id", userId).eq("is_default", false);
    if (error) throw new ExerciseRepositoryError("내 스티커를 수정하지 못했습니다.");
    return;
  }
  const { error } = await supabase.from("exercise_stickers").insert({ user_id: userId, label: values.label, icon_key: values.iconKey, color_key: values.colorKey, is_default: false });
  if (error) throw new ExerciseRepositoryError(error.code === "23505" ? "같은 이름의 스티커가 이미 있습니다." : "내 스티커를 만들지 못했습니다.");
}

export async function removeCustomExerciseSticker(id: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  const { error } = await supabase.from("exercise_stickers").delete().eq("id", id).eq("user_id", userId).eq("is_default", false);
  if (error) throw new ExerciseRepositoryError(error.code === "23503" ? "기록에 사용한 스티커는 먼저 기록을 삭제해 주세요." : "내 스티커를 삭제하지 못했습니다.");
}
