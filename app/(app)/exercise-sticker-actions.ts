"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  deleteCompetitionReview,
  deleteLessonReview,
  ExerciseReviewRepositoryError,
  upsertCompetitionReview,
  upsertLessonReview,
} from "@/lib/exercise/review-repository";
import { competitionReviewInputSchema, exerciseLogInputSchema, lessonReviewInputSchema } from "@/lib/exercise/reviews";
import {
  ExerciseRepositoryError,
  removeCustomExerciseSticker,
  removeExerciseLog,
  saveCustomExerciseSticker,
  saveExerciseLog,
  updateExerciseLog,
} from "@/lib/exercise/repository";
import type { ExerciseRecordType } from "@/types/database";

export type StickerActionState = { readonly status: "idle" | "success" | "error"; readonly message?: string };
export type ExerciseCreateActionState =
  | { readonly status: "idle"; readonly message?: string }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "success"; readonly outcome: "duplicate"; readonly message: string }
  | { readonly status: "success"; readonly outcome: "created" | "existing"; readonly message: string; readonly logId: string; readonly recordType: ExerciseRecordType };
export type ExerciseReviewActionState =
  | { readonly status: "idle" }
  | { readonly status: "success"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

const idSchema = z.string().uuid();
const colorSchema = z.enum(["mint", "pink", "yellow", "coral", "blue", "lavender", "sky", "aqua", "cream"]);
const iconSchema = z.enum(["badminton", "badminton_lesson", "walking", "running", "strength", "stretching", "cycling", "swimming", "pilates", "other"]);

function refreshExercise(): void {
  revalidatePath("/exercise");
  revalidatePath("/briefing");
}

function nullableText(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function nullableNumber(formData: FormData, key: string): number | null {
  const value = String(formData.get(key) ?? "").trim();
  return value ? Number(value) : null;
}

function safeMessage(error: unknown, fallback: string): string {
  return error instanceof ExerciseRepositoryError || error instanceof ExerciseReviewRepositoryError
    ? error.message
    : fallback;
}

export async function attachExerciseStickerAction(_state: StickerActionState, formData: FormData): Promise<ExerciseCreateActionState> {
  const parsed = exerciseLogInputSchema.safeParse({
    eventId: nullableText(formData, "eventId"),
    stickerId: String(formData.get("stickerId") ?? ""),
    exerciseDate: String(formData.get("exerciseDate") ?? ""),
    recordType: String(formData.get("recordType") ?? "exercise"),
    durationMinutes: nullableNumber(formData, "durationMinutes"),
    note: nullableText(formData, "note"),
  });
  if (!parsed.success) return { status: "error", message: "운동 종류, 날짜와 기록 유형을 확인해 주세요." };
  if (parsed.data.eventId && parsed.data.durationMinutes === null) {
    return { status: "error", message: "운동 시간을 입력해 주세요." };
  }
  try {
    const { eventId, ...values } = parsed.data;
    const result = await saveExerciseLog({
      ...values,
      ...(eventId ? { eventId } : {}),
    });
    refreshExercise();
    if (result.status === "duplicate") return { status: "success", outcome: "duplicate", message: "같은 날짜에 이미 기록한 운동이에요." };
    if (result.status === "existing") {
      return {
        status: "success",
        outcome: "existing",
        message: "연결된 운동 기록을 불러왔습니다.",
        logId: result.log.id,
        recordType: result.log.recordType,
      };
    }
    return {
      status: "success",
      outcome: "created",
      message: "운동 기록을 저장했습니다.",
      logId: result.log.id,
      recordType: result.log.recordType,
    };
  } catch (error) {
    return { status: "error", message: safeMessage(error, "운동 기록을 저장하지 못했습니다.") };
  }
}

export async function saveLessonReviewAction(_state: ExerciseReviewActionState, formData: FormData): Promise<ExerciseReviewActionState> {
  const parsed = lessonReviewInputSchema.safeParse({
    exerciseLogId: String(formData.get("exerciseLogId") ?? ""),
    lessonFocus: nullableText(formData, "lessonFocus"),
    learned: nullableText(formData, "learned"),
    mistakes: nullableText(formData, "mistakes"),
    coachFeedback: nullableText(formData, "coachFeedback"),
    nextGoal: nullableText(formData, "nextGoal"),
    memo: nullableText(formData, "memo"),
  });
  if (!parsed.success) return { status: "error", message: "레슨 리뷰 내용을 하나 이상 입력해 주세요." };
  try {
    await upsertLessonReview(parsed.data);
    refreshExercise();
    return { status: "success", message: "레슨 리뷰를 저장했습니다." };
  } catch (error) {
    return { status: "error", message: safeMessage(error, "레슨 리뷰를 저장하지 못했습니다.") };
  }
}

export async function saveCompetitionReviewAction(_state: ExerciseReviewActionState, formData: FormData): Promise<ExerciseReviewActionState> {
  const parsed = competitionReviewInputSchema.safeParse({
    exerciseLogId: String(formData.get("exerciseLogId") ?? ""),
    competitionName: nullableText(formData, "competitionName"),
    location: nullableText(formData, "location"),
    eventCategory: nullableText(formData, "eventCategory"),
    grade: nullableText(formData, "grade"),
    partner: nullableText(formData, "partner"),
    totalGames: nullableNumber(formData, "totalGames"),
    wins: nullableNumber(formData, "wins"),
    losses: nullableNumber(formData, "losses"),
    finalResult: nullableText(formData, "finalResult"),
    strengths: nullableText(formData, "strengths"),
    improvements: nullableText(formData, "improvements"),
    nextGoal: nullableText(formData, "nextGoal"),
    memo: nullableText(formData, "memo"),
  });
  if (!parsed.success) return { status: "error", message: "대회 리뷰 내용과 경기 수를 확인해 주세요." };
  try {
    await upsertCompetitionReview(parsed.data);
    refreshExercise();
    return { status: "success", message: "대회 리뷰를 저장했습니다." };
  } catch (error) {
    return { status: "error", message: safeMessage(error, "대회 리뷰를 저장하지 못했습니다.") };
  }
}

async function deleteReview(
  formData: FormData,
  remove: (exerciseLogId: string) => Promise<void>,
  label: "레슨" | "대회",
): Promise<ExerciseReviewActionState> {
  const id = idSchema.safeParse(String(formData.get("exerciseLogId") ?? ""));
  if (!id.success) return { status: "error", message: `${label} 리뷰를 확인해 주세요.` };
  try {
    await remove(id.data);
    refreshExercise();
    return { status: "success", message: `${label} 리뷰를 삭제했습니다.` };
  } catch (error) {
    return { status: "error", message: safeMessage(error, `${label} 리뷰를 삭제하지 못했습니다.`) };
  }
}

export async function deleteLessonReviewAction(_state: ExerciseReviewActionState, formData: FormData): Promise<ExerciseReviewActionState> {
  return deleteReview(formData, deleteLessonReview, "레슨");
}

export async function deleteCompetitionReviewAction(_state: ExerciseReviewActionState, formData: FormData): Promise<ExerciseReviewActionState> {
  return deleteReview(formData, deleteCompetitionReview, "대회");
}

export async function removeExerciseStickerAction(_state: StickerActionState, formData: FormData): Promise<StickerActionState> {
  const id = idSchema.safeParse(String(formData.get("logId") ?? ""));
  if (!id.success) return { status: "error", message: "운동 기록을 확인해 주세요." };
  try {
    await removeExerciseLog(id.data);
    refreshExercise();
    return { status: "success", message: "운동 기록을 삭제했습니다." };
  } catch (error) {
    return { status: "error", message: safeMessage(error, "운동 기록을 삭제하지 못했습니다.") };
  }
}

export async function updateExerciseStickerDetailsAction(_state: StickerActionState, formData: FormData): Promise<StickerActionState> {
  const id = idSchema.safeParse(String(formData.get("logId") ?? ""));
  const stickerIdText = String(formData.get("stickerId") ?? "").trim();
  const stickerId = stickerIdText ? idSchema.safeParse(stickerIdText) : null;
  const duration = nullableNumber(formData, "durationMinutes");
  const note = nullableText(formData, "note");
  if (!id.success || (stickerId && !stickerId.success) || (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) || (note?.length ?? 0) > 500) return { status: "error", message: "운동 종류, 시간과 메모를 확인해 주세요." };
  try {
    await updateExerciseLog(id.data, stickerId?.success ? stickerId.data : null, duration, note);
    refreshExercise();
    return { status: "success", message: "운동 기록을 저장했습니다." };
  } catch (error) {
    return { status: "error", message: safeMessage(error, "운동 기록을 수정하지 못했습니다.") };
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
    return { status: "success", message: id ? "내 스티커를 수정했습니다." : "내 스티커를 만들었습니다." };
  } catch (error) {
    return { status: "error", message: safeMessage(error, "내 스티커를 저장하지 못했습니다.") };
  }
}

export async function removeCustomExerciseStickerAction(_state: StickerActionState, formData: FormData): Promise<StickerActionState> {
  const id = idSchema.safeParse(String(formData.get("id") ?? ""));
  if (!id.success) return { status: "error", message: "스티커를 확인해 주세요." };
  try {
    await removeCustomExerciseSticker(id.data);
    refreshExercise();
    return { status: "success", message: "내 스티커를 삭제했습니다." };
  } catch (error) {
    return { status: "error", message: safeMessage(error, "내 스티커를 삭제하지 못했습니다.") };
  }
}
