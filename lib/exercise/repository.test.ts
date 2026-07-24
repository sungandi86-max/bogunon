import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteCompetitionReview,
  deleteLessonReview,
  getCompetitionReview,
  getLessonReview,
  upsertCompetitionReview,
  upsertLessonReview,
} from "@/lib/exercise/review-repository";
import { listExerciseStickerData, listRecentExerciseLogs, saveExerciseLog } from "@/lib/exercise/repository";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) };
const log = {
  id: "20000000-0000-4000-8000-000000000001",
  user_id: "user-1",
  sticker_id: "10000000-0000-4000-8000-000000000001",
  exercise_date: "2026-07-22",
  duration_minutes: null,
  note: null,
  record_type: "lesson" as const,
  created_at: "2026-07-22T00:00:00Z",
  updated_at: "2026-07-22T00:00:00Z",
};
const lessonReview = {
  exercise_log_id: log.id,
  record_type: "lesson" as const,
  lesson_focus: "드라이브",
  learned: null,
  mistakes: null,
  coach_feedback: null,
  next_goal: null,
  memo: null,
  created_at: log.created_at,
  updated_at: log.updated_at,
};

function query(result: { readonly data: unknown; readonly error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "gte", "lte", "in", "order", "limit", "single", "maybeSingle", "insert", "upsert", "delete", "update"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder["then"] = vi.fn((resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve));
  return builder;
}

describe("exercise V2 repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created log id and type and reports duplicate without an id", async () => {
    const created = query({ data: { id: log.id, record_type: "lesson" }, error: null });
    vi.mocked(createClient).mockResolvedValue({ auth, from: vi.fn(() => created) } as never);

    await expect(saveExerciseLog({
      eventId: "30000000-0000-4000-8000-000000000001",
      stickerId: log.sticker_id,
      exerciseDate: log.exercise_date,
      recordType: "lesson",
      durationMinutes: null,
      note: null,
    })).resolves.toEqual({ status: "created", log: { id: log.id, recordType: "lesson" } });
    expect(created["insert"]).toHaveBeenCalledWith(expect.objectContaining({
      event_id: "30000000-0000-4000-8000-000000000001",
      user_id: "user-1",
    }));

    const duplicate = query({ data: null, error: { code: "23505", message: "sensitive constraint detail" } });
    vi.mocked(createClient).mockResolvedValue({ auth, from: vi.fn(() => duplicate) } as never);
    await expect(saveExerciseLog({
      stickerId: log.sticker_id,
      exerciseDate: log.exercise_date,
      recordType: "lesson",
      durationMinutes: null,
      note: null,
    })).resolves.toEqual({ status: "duplicate" });
  });

  it("hydrates month and recent logs with matching review maps", async () => {
    const stickers = query({ data: [], error: null });
    const logs = query({ data: [log], error: null });
    const lessons = query({ data: [lessonReview], error: null });
    const competitions = query({ data: [], error: null });
    const from = vi.fn()
      .mockReturnValueOnce(stickers)
      .mockReturnValueOnce(logs)
      .mockReturnValueOnce(lessons)
      .mockReturnValueOnce(competitions);
    vi.mocked(createClient).mockResolvedValue({ auth, from } as never);

    await expect(listExerciseStickerData("2026-07-01", "2026-07-31")).resolves.toMatchObject({
      logs: [{ id: log.id, lessonReview, competitionReview: null }],
    });

    const recentLogs = query({ data: [log], error: null });
    const recentLessons = query({ data: [lessonReview], error: null });
    const recentCompetitions = query({ data: [], error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth,
      from: vi.fn().mockReturnValueOnce(recentLogs).mockReturnValueOnce(recentLessons).mockReturnValueOnce(recentCompetitions),
    } as never);
    await expect(listRecentExerciseLogs()).resolves.toMatchObject([{ lessonReview, competitionReview: null }]);
  });

  it("checks ownership and parent type before reading or writing lesson reviews", async () => {
    const parent = query({ data: { record_type: "lesson" }, error: null });
    const review = query({ data: lessonReview, error: null });
    const from = vi.fn().mockReturnValueOnce(parent).mockReturnValueOnce(review);
    vi.mocked(createClient).mockResolvedValue({ auth, from } as never);

    await expect(getLessonReview(log.id)).resolves.toEqual(lessonReview);
    expect(parent["eq"]).toHaveBeenCalledWith("user_id", "user-1");

    const mismatch = query({ data: { record_type: "competition" }, error: null });
    vi.mocked(createClient).mockResolvedValue({ auth, from: vi.fn(() => mismatch) } as never);
    await expect(upsertLessonReview({ exerciseLogId: log.id, lessonFocus: "드라이브", learned: null, mistakes: null, coachFeedback: null, nextGoal: null, memo: null })).rejects.toThrow("레슨 기록에만 레슨 리뷰를 저장할 수 있습니다.");
  });

  it("rejects a missing parent and translates a parent query failure", async () => {
    const missing = query({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue({ auth, from: vi.fn(() => missing) } as never);
    await expect(getLessonReview(log.id)).rejects.toThrow("운동 기록을 찾을 수 없습니다.");
    expect(missing["eq"]).toHaveBeenCalledWith("user_id", "user-1");

    const failed = query({ data: null, error: { message: "private database detail" } });
    vi.mocked(createClient).mockResolvedValue({ auth, from: vi.fn(() => failed) } as never);
    await expect(getCompetitionReview(log.id)).rejects.toThrow("운동 기록을 확인하지 못했습니다.");
  });

  it("rejects a competition review for a lesson parent", async () => {
    const mismatch = query({ data: { record_type: "lesson" }, error: null });
    vi.mocked(createClient).mockResolvedValue({ auth, from: vi.fn(() => mismatch) } as never);
    await expect(upsertCompetitionReview({
      exerciseLogId: log.id,
      competitionName: "학교장배",
      location: null,
      eventCategory: null,
      grade: null,
      partner: null,
      totalGames: null,
      wins: null,
      losses: null,
      finalResult: null,
      strengths: null,
      improvements: null,
      nextGoal: null,
      memo: null,
    })).rejects.toThrow("대회 기록에만 대회 리뷰를 저장할 수 있습니다.");
  });

  it("uses owner-checked parent types for competition review lifecycle and never leaks database errors", async () => {
    const parent = query({ data: { record_type: "competition" }, error: null });
    const failure = query({ data: null, error: { message: "password=secret" } });
    vi.mocked(createClient).mockResolvedValue({ auth, from: vi.fn().mockReturnValueOnce(parent).mockReturnValueOnce(failure) } as never);
    await expect(upsertCompetitionReview({
      exerciseLogId: log.id,
      competitionName: "학교장배",
      location: null,
      eventCategory: null,
      grade: null,
      partner: null,
      totalGames: null,
      wins: null,
      losses: null,
      finalResult: null,
      strengths: null,
      improvements: null,
      nextGoal: null,
      memo: null,
    })).rejects.toThrow("대회 리뷰를 저장하지 못했습니다.");

  });

  it("translates lesson review database failures without leaking details", async () => {
    const parent = query({ data: { record_type: "lesson" }, error: null });
    const failure = query({ data: null, error: { message: "token=private" } });
    vi.mocked(createClient).mockResolvedValue({ auth, from: vi.fn().mockReturnValueOnce(parent).mockReturnValueOnce(failure) } as never);
    await expect(upsertLessonReview({
      exerciseLogId: log.id,
      lessonFocus: "드라이브",
      learned: null,
      mistakes: null,
      coachFeedback: null,
      nextGoal: null,
      memo: null,
    })).rejects.toThrow("레슨 리뷰를 저장하지 못했습니다.");
  });

  it("writes and deletes only the review matching the owner-checked parent", async () => {
    const lessonParent = query({ data: { record_type: "lesson" }, error: null });
    const lessonWrite = query({ data: lessonReview, error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth,
      from: vi.fn().mockReturnValueOnce(lessonParent).mockReturnValueOnce(lessonWrite),
    } as never);
    await expect(upsertLessonReview({
      exerciseLogId: log.id,
      lessonFocus: "드라이브",
      learned: null,
      mistakes: null,
      coachFeedback: null,
      nextGoal: null,
      memo: null,
    })).resolves.toEqual(lessonReview);
    expect(lessonParent["eq"]).toHaveBeenCalledWith("user_id", "user-1");
    expect(lessonWrite["upsert"]).toHaveBeenCalledWith(expect.objectContaining({ exercise_log_id: log.id, lesson_focus: "드라이브" }), { onConflict: "exercise_log_id" });

    const competitionParent = query({ data: { record_type: "competition" }, error: null });
    const competitionReview = query({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth,
      from: vi.fn().mockReturnValueOnce(competitionParent).mockReturnValueOnce(competitionReview),
    } as never);
    await expect(getCompetitionReview(log.id)).resolves.toBeNull();
    expect(competitionParent["eq"]).toHaveBeenCalledWith("user_id", "user-1");

    const deleteParent = query({ data: { record_type: "lesson" }, error: null });
    const deletion = query({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth,
      from: vi.fn().mockReturnValueOnce(deleteParent).mockReturnValueOnce(deletion),
    } as never);
    await expect(deleteLessonReview(log.id)).resolves.toBeUndefined();
    expect(deleteParent["eq"]).toHaveBeenCalledWith("user_id", "user-1");
    expect(deletion["eq"]).toHaveBeenCalledWith("exercise_log_id", log.id);

    const competitionDeleteParent = query({ data: { record_type: "competition" }, error: null });
    const competitionDeletion = query({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth,
      from: vi.fn().mockReturnValueOnce(competitionDeleteParent).mockReturnValueOnce(competitionDeletion),
    } as never);
    await expect(deleteCompetitionReview(log.id)).resolves.toBeUndefined();
    expect(competitionDeleteParent["eq"]).toHaveBeenCalledWith("user_id", "user-1");
  });
});
