import type { SupabaseClient } from "@supabase/supabase-js";

import type { CompetitionReviewInput, LessonReviewInput } from "@/lib/exercise/reviews";
import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  ExerciseCompetitionReviewRow,
  ExerciseLessonReviewRow,
  ExerciseRecordType,
} from "@/types/database";

export class ExerciseReviewRepositoryError extends Error {
  readonly name = "ExerciseReviewRepositoryError";
}

async function ownedClient(): Promise<{ readonly supabase: SupabaseClient<Database>; readonly userId: string }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ExerciseReviewRepositoryError("로그인이 필요합니다.");
  return { supabase, userId: user.id };
}

async function requireParentType(
  supabase: SupabaseClient<Database>,
  userId: string,
  exerciseLogId: string,
  expectedType: Extract<ExerciseRecordType, "lesson" | "competition">,
): Promise<void> {
  const { data, error } = await supabase.from("exercise_logs").select("record_type").eq("id", exerciseLogId).eq("user_id", userId).maybeSingle();
  if (error) throw new ExerciseReviewRepositoryError("운동 기록을 확인하지 못했습니다.");
  if (!data) throw new ExerciseReviewRepositoryError("운동 기록을 찾을 수 없습니다.");
  if (data.record_type !== expectedType) {
    throw new ExerciseReviewRepositoryError(expectedType === "lesson"
      ? "레슨 기록에만 레슨 리뷰를 저장할 수 있습니다."
      : "대회 기록에만 대회 리뷰를 저장할 수 있습니다.");
  }
}

export async function getLessonReview(exerciseLogId: string): Promise<ExerciseLessonReviewRow | null> {
  const { supabase, userId } = await ownedClient();
  await requireParentType(supabase, userId, exerciseLogId, "lesson");
  const { data, error } = await supabase.from("exercise_lesson_reviews").select("*").eq("exercise_log_id", exerciseLogId).maybeSingle();
  if (error) throw new ExerciseReviewRepositoryError("레슨 리뷰를 불러오지 못했습니다.");
  return data;
}

export async function upsertLessonReview(values: LessonReviewInput): Promise<ExerciseLessonReviewRow> {
  const { supabase, userId } = await ownedClient();
  await requireParentType(supabase, userId, values.exerciseLogId, "lesson");
  const { data, error } = await supabase.from("exercise_lesson_reviews").upsert({
    exercise_log_id: values.exerciseLogId,
    lesson_focus: values.lessonFocus,
    learned: values.learned,
    mistakes: values.mistakes,
    coach_feedback: values.coachFeedback,
    next_goal: values.nextGoal,
    memo: values.memo,
  }, { onConflict: "exercise_log_id" }).select("*").single();
  if (error) throw new ExerciseReviewRepositoryError("레슨 리뷰를 저장하지 못했습니다.");
  return data;
}

export async function deleteLessonReview(exerciseLogId: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  await requireParentType(supabase, userId, exerciseLogId, "lesson");
  const { error } = await supabase.from("exercise_lesson_reviews").delete().eq("exercise_log_id", exerciseLogId);
  if (error) throw new ExerciseReviewRepositoryError("레슨 리뷰를 삭제하지 못했습니다.");
}

export async function getCompetitionReview(exerciseLogId: string): Promise<ExerciseCompetitionReviewRow | null> {
  const { supabase, userId } = await ownedClient();
  await requireParentType(supabase, userId, exerciseLogId, "competition");
  const { data, error } = await supabase.from("exercise_competition_reviews").select("*").eq("exercise_log_id", exerciseLogId).maybeSingle();
  if (error) throw new ExerciseReviewRepositoryError("대회 리뷰를 불러오지 못했습니다.");
  return data;
}

export async function upsertCompetitionReview(values: CompetitionReviewInput): Promise<ExerciseCompetitionReviewRow> {
  const { supabase, userId } = await ownedClient();
  await requireParentType(supabase, userId, values.exerciseLogId, "competition");
  const { data, error } = await supabase.from("exercise_competition_reviews").upsert({
    exercise_log_id: values.exerciseLogId,
    competition_name: values.competitionName,
    location: values.location,
    event_category: values.eventCategory,
    grade: values.grade,
    partner: values.partner,
    total_games: values.totalGames,
    wins: values.wins,
    losses: values.losses,
    final_result: values.finalResult,
    strengths: values.strengths,
    improvements: values.improvements,
    next_goal: values.nextGoal,
    memo: values.memo,
  }, { onConflict: "exercise_log_id" }).select("*").single();
  if (error) throw new ExerciseReviewRepositoryError("대회 리뷰를 저장하지 못했습니다.");
  return data;
}

export async function deleteCompetitionReview(exerciseLogId: string): Promise<void> {
  const { supabase, userId } = await ownedClient();
  await requireParentType(supabase, userId, exerciseLogId, "competition");
  const { error } = await supabase.from("exercise_competition_reviews").delete().eq("exercise_log_id", exerciseLogId);
  if (error) throw new ExerciseReviewRepositoryError("대회 리뷰를 삭제하지 못했습니다.");
}
