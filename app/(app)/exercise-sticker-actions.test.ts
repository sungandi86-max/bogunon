import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";

import {
  attachExerciseStickerAction,
  deleteCompetitionReviewAction,
  deleteLessonReviewAction,
  removeExerciseStickerAction,
  saveCompetitionReviewAction,
  saveCustomExerciseStickerAction,
  saveLessonReviewAction,
  updateExerciseStickerDetailsAction,
} from "@/app/(app)/exercise-sticker-actions";
import { deleteCompetitionReview, deleteLessonReview, ExerciseReviewRepositoryError, upsertCompetitionReview, upsertLessonReview } from "@/lib/exercise/review-repository";
import { ExerciseRepositoryError, removeExerciseLog, saveCustomExerciseSticker, saveExerciseLog, updateExerciseLog } from "@/lib/exercise/repository";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/exercise/repository", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/exercise/repository")>();
  return { ...original, saveExerciseLog: vi.fn(), removeExerciseLog: vi.fn(), updateExerciseLog: vi.fn(), saveCustomExerciseSticker: vi.fn(), removeCustomExerciseSticker: vi.fn() };
});
vi.mock("@/lib/exercise/review-repository", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/exercise/review-repository")>();
  return { ...original, upsertLessonReview: vi.fn(), deleteLessonReview: vi.fn(), upsertCompetitionReview: vi.fn(), deleteCompetitionReview: vi.fn() };
});

const stickerId = "10000000-0000-4000-8000-000000000001";
const logId = "20000000-0000-4000-8000-000000000001";

describe("exercise sticker actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores a confirmed exercise record with optional details and reports duplicates", async () => {
    vi.mocked(saveExerciseLog)
      .mockResolvedValueOnce({ status: "created", log: { id: logId, recordType: "lesson" } })
      .mockResolvedValueOnce({ status: "duplicate" });
    const form = new FormData();
    form.set("stickerId", stickerId);
    form.set("exerciseDate", "2026-07-18");
    form.set("completed", "on");
    form.set("recordType", "lesson");
    form.set("durationMinutes", "60");
    form.set("note", "가볍게 운동함");
    await expect(attachExerciseStickerAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success", outcome: "created", logId, recordType: "lesson" });
    const duplicate = await attachExerciseStickerAction({ status: "idle" }, form);
    expect(duplicate).toEqual({ status: "success", outcome: "duplicate", message: "같은 날짜에 이미 기록한 운동이에요." });
    expect(duplicate).not.toHaveProperty("logId");
    expect(saveExerciseLog).toHaveBeenCalledWith({ stickerId, exerciseDate: "2026-07-18", recordType: "lesson", durationMinutes: 60, note: "가볍게 운동함" });
  });

  it.each(["exercise", "competition"] as const)("returns the created id and %s type", async (recordType) => {
    vi.mocked(saveExerciseLog).mockResolvedValueOnce({ status: "created", log: { id: logId, recordType } });
    const form = new FormData();
    form.set("stickerId", stickerId);
    form.set("exerciseDate", "2026-07-18");
    form.set("recordType", recordType);

    await expect(attachExerciseStickerAction({ status: "idle" }, form)).resolves.toMatchObject({
      status: "success",
      outcome: "created",
      logId,
      recordType,
    });
  });

  it("returns a stable error without an id when record input or storage fails", async () => {
    const invalid = new FormData();
    invalid.set("stickerId", stickerId);
    invalid.set("exerciseDate", "2026-02-30");
    invalid.set("recordType", "competition");
    const invalidResult = await attachExerciseStickerAction({ status: "idle" }, invalid);
    expect(invalidResult).toEqual({ status: "error", message: "운동 종류, 날짜와 기록 유형을 확인해 주세요." });
    expect(invalidResult).not.toHaveProperty("logId");

    vi.mocked(saveExerciseLog).mockRejectedValueOnce(new ExerciseRepositoryError("운동 기록을 저장하지 못했습니다."));
    invalid.set("exerciseDate", "2026-07-18");
    await expect(attachExerciseStickerAction({ status: "idle" }, invalid)).resolves.toEqual({ status: "error", message: "운동 기록을 저장하지 못했습니다." });

    vi.mocked(saveExerciseLog).mockRejectedValueOnce(new Error("password=secret"));
    await expect(attachExerciseStickerAction({ status: "idle" }, invalid)).resolves.toEqual({ status: "error", message: "운동 기록을 저장하지 못했습니다." });
  });

  it("creates and deletes a lesson review through strict parsed fields", async () => {
    const form = new FormData();
    form.set("exerciseLogId", logId);
    form.set("lessonFocus", "드라이브");
    await expect(saveLessonReviewAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    expect(upsertLessonReview).toHaveBeenCalledWith({
      exerciseLogId: logId,
      lessonFocus: "드라이브",
      learned: null,
      mistakes: null,
      coachFeedback: null,
      nextGoal: null,
      memo: null,
    });
    await expect(deleteLessonReviewAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    expect(deleteLessonReview).toHaveBeenCalledWith(logId);
  });

  it("rejects blank and overlength lesson reviews before the repository call", async () => {
    const form = new FormData();
    form.set("exerciseLogId", logId);
    form.set("lessonFocus", "   ");
    await expect(saveLessonReviewAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "error" });
    form.set("lessonFocus", "가".repeat(201));
    await expect(saveLessonReviewAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "error" });
    expect(upsertLessonReview).not.toHaveBeenCalled();
  });

  it("validates competition counts before writing and supports review deletion", async () => {
    const form = new FormData();
    form.set("exerciseLogId", logId);
    form.set("competitionName", "학교장배");
    form.set("totalGames", "2");
    form.set("wins", "2");
    form.set("losses", "1");
    await expect(saveCompetitionReviewAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "error" });
    expect(upsertCompetitionReview).not.toHaveBeenCalled();
    form.set("totalGames", "3");
    await expect(saveCompetitionReviewAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    await expect(deleteCompetitionReviewAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    expect(deleteCompetitionReview).toHaveBeenCalledWith(logId);
  });

  it("rejects overlength competition text before the repository call", async () => {
    const form = new FormData();
    form.set("exerciseLogId", logId);
    form.set("competitionName", "가".repeat(201));
    await expect(saveCompetitionReviewAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "error" });
    expect(upsertCompetitionReview).not.toHaveBeenCalled();
  });

  it("translates lesson and competition parent mismatches without exposing database details", async () => {
    vi.mocked(upsertLessonReview).mockRejectedValueOnce(new ExerciseReviewRepositoryError("레슨 기록에만 레슨 리뷰를 저장할 수 있습니다."));
    const lesson = new FormData();
    lesson.set("exerciseLogId", logId);
    lesson.set("lessonFocus", "드라이브");
    await expect(saveLessonReviewAction({ status: "idle" }, lesson)).resolves.toEqual({ status: "error", message: "레슨 기록에만 레슨 리뷰를 저장할 수 있습니다." });

    vi.mocked(upsertCompetitionReview).mockRejectedValueOnce(new ExerciseReviewRepositoryError("대회 기록에만 대회 리뷰를 저장할 수 있습니다."));
    const competition = new FormData();
    competition.set("exerciseLogId", logId);
    competition.set("competitionName", "학교장배");
    await expect(saveCompetitionReviewAction({ status: "idle" }, competition)).resolves.toEqual({ status: "error", message: "대회 기록에만 대회 리뷰를 저장할 수 있습니다." });

    vi.mocked(upsertCompetitionReview).mockRejectedValueOnce(new Error("password=secret"));
    const result = await saveCompetitionReviewAction({ status: "idle" }, competition);
    expect(result).toEqual({ status: "error", message: "대회 리뷰를 저장하지 못했습니다." });
    if (result.status === "idle") throw new Error("error result expected");
    expect(result.message).not.toContain("secret");
  });

  it("removes a selected sticker and keeps optional details nullable", async () => {
    const removeForm = new FormData(); removeForm.set("logId", logId);
    await expect(removeExerciseStickerAction({ status: "idle" }, removeForm)).resolves.toMatchObject({ status: "success" });
    expect(removeExerciseLog).toHaveBeenCalledWith(logId);
    expect(revalidatePath).toHaveBeenCalledWith("/exercise");
    expect(revalidatePath).not.toHaveBeenCalledWith("/calendar");
    expect(revalidatePath).toHaveBeenCalledWith("/briefing");
    const updateForm = new FormData(); updateForm.set("logId", logId); updateForm.set("durationMinutes", ""); updateForm.set("note", "");
    await updateExerciseStickerDetailsAction({ status: "idle" }, updateForm);
    expect(updateExerciseLog).toHaveBeenCalledWith(logId, null, null);
  });

  it("creates a custom sticker from the Pilates icon key rather than an emoji", async () => {
    const form = new FormData(); form.set("label", "필라테스 심화"); form.set("iconKey", "pilates"); form.set("colorKey", "pink");
    await expect(saveCustomExerciseStickerAction({ status: "idle" }, form)).resolves.toMatchObject({ status: "success" });
    expect(saveCustomExerciseSticker).toHaveBeenCalledWith({ label: "필라테스 심화", iconKey: "pilates", colorKey: "pink" });
  });
});
