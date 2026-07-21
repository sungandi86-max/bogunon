import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompetitionReviewForm } from "@/components/exercise/competition-review-form";
import { LessonReviewForm } from "@/components/exercise/lesson-review-form";
import { lessonReviewInputSchema } from "@/lib/exercise/reviews";
import type { ExerciseCompetitionReviewRow, ExerciseLessonReviewRow } from "@/types/database";

const mocks = vi.hoisted(() => ({
  deleteCompetition: vi.fn(async (state: import("@/app/(app)/exercise-sticker-actions").ExerciseReviewActionState, formData: FormData) => { void state; void formData; return { status: "success" as const, message: "대회 리뷰를 삭제했습니다." }; }),
  deleteLesson: vi.fn(async (state: import("@/app/(app)/exercise-sticker-actions").ExerciseReviewActionState, formData: FormData) => { void state; void formData; return { status: "success" as const, message: "레슨 리뷰를 삭제했습니다." }; }),
  refresh: vi.fn(),
  saveCompetition: vi.fn(async (state: import("@/app/(app)/exercise-sticker-actions").ExerciseReviewActionState, formData: FormData) => { void state; void formData; return { status: "success" as const, message: "대회 리뷰를 저장했습니다." }; }),
  saveLesson: vi.fn(async (state: import("@/app/(app)/exercise-sticker-actions").ExerciseReviewActionState, formData: FormData) => { void state; void formData; return { status: "success" as const, message: "레슨 리뷰를 저장했습니다." }; }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/app/(app)/exercise-sticker-actions", () => ({
  deleteCompetitionReviewAction: mocks.deleteCompetition,
  deleteLessonReviewAction: mocks.deleteLesson,
  saveCompetitionReviewAction: mocks.saveCompetition,
  saveLessonReviewAction: mocks.saveLesson,
}));

const logId = "20000000-0000-4000-8000-000000000001";
const lessonReview: ExerciseLessonReviewRow = { exercise_log_id: logId, record_type: "lesson", lesson_focus: "드라이브", learned: "준비 자세", mistakes: null, coach_feedback: null, next_goal: null, memo: null, created_at: "2026-07-22T00:00:00Z", updated_at: "2026-07-22T00:00:00Z" };
const competitionReview: ExerciseCompetitionReviewRow = { exercise_log_id: logId, record_type: "competition", competition_name: "여름 대회", location: null, event_category: "여자복식 40C", grade: null, partner: null, total_games: 3, wins: 2, losses: 1, final_result: "준우승", strengths: null, improvements: null, next_goal: null, memo: null, created_at: "2026-07-22T00:00:00Z", updated_at: "2026-07-22T00:00:00Z" };

afterEach(() => vi.clearAllMocks());

describe("exercise review forms", () => {
  it("shows the exact lesson empty state and creates a review", async () => {
    render(<LessonReviewForm exerciseLogId={logId} review={null} />);
    expect(screen.getByText("아직 작성된 레슨 리뷰가 없습니다.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("오늘 집중한 기술"), { target: { value: "드라이브" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "레슨 리뷰 저장" })));
    expect(mocks.saveLesson).toHaveBeenCalledOnce();
    expect(mocks.saveLesson.mock.calls[0]?.[1].get("lessonFocus")).toBe("드라이브");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("hydrates, updates, and deletes a lesson review", async () => {
    render(<LessonReviewForm exerciseLogId={logId} review={lessonReview} />);
    expect(screen.getByLabelText("오늘 집중한 기술")).toHaveValue("드라이브");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "레슨 리뷰 수정" })));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "리뷰 삭제" })));
    expect(mocks.saveLesson).toHaveBeenCalledOnce();
    expect(mocks.deleteLesson).toHaveBeenCalledOnce();
    expect(mocks.deleteLesson.mock.calls[0]?.[1].get("exerciseLogId")).toBe(logId);
  });

  it("shows the exact competition empty state and creates a review", async () => {
    render(<CompetitionReviewForm exerciseLogId={logId} review={null} />);
    expect(screen.getByText("아직 작성된 대회 리뷰가 없습니다.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("대회명"), { target: { value: "여름 대회" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "대회 리뷰 저장" })));
    expect(mocks.saveCompetition).toHaveBeenCalledOnce();
    expect(mocks.saveCompetition.mock.calls[0]?.[1].get("competitionName")).toBe("여름 대회");
  });

  it("hydrates, updates, and deletes a competition review", async () => {
    render(<CompetitionReviewForm exerciseLogId={logId} review={competitionReview} />);
    expect(screen.getByLabelText("종목")).toHaveValue("여자복식 40C");
    expect(screen.getByLabelText("최종 결과")).toHaveValue("준우승");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "대회 리뷰 수정" })));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "리뷰 삭제" })));
    expect(mocks.saveCompetition).toHaveBeenCalledOnce();
    expect(mocks.deleteCompetition).toHaveBeenCalledOnce();
  });

  it("matches the lesson focus 200-character boundary and submits the exact value", async () => {
    const boundary = "가".repeat(200);
    render(<LessonReviewForm exerciseLogId={logId} review={null} />);
    const input = screen.getByLabelText("오늘 집중한 기술");
    expect(input).toHaveAttribute("maxlength", "200");
    fireEvent.change(input, { target: { value: boundary } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "레슨 리뷰 저장" })));
    expect(mocks.saveLesson.mock.calls[0]?.[1].get("lessonFocus")).toBe(boundary);
    expect(lessonReviewInputSchema.safeParse({ exerciseLogId: logId, lessonFocus: `${boundary}가` }).success).toBe(false);
  });

  it("resets uncontrolled values across null, hydrated, and deleted review props", () => {
    const { rerender } = render(<LessonReviewForm exerciseLogId={logId} review={null} />);
    fireEvent.change(screen.getByLabelText("오늘 집중한 기술"), { target: { value: "임시 입력" } });
    rerender(<LessonReviewForm exerciseLogId={logId} review={lessonReview} />);
    expect(screen.getByLabelText("오늘 집중한 기술")).toHaveValue("드라이브");
    fireEvent.change(screen.getByLabelText("오늘 집중한 기술"), { target: { value: "수정 중" } });
    rerender(<LessonReviewForm exerciseLogId={logId} review={null} />);
    expect(screen.getByLabelText("오늘 집중한 기술")).toHaveValue("");
  });

  it("disables review actions while pending and prevents double submission", async () => {
    let finish: (() => void) | undefined;
    mocks.saveLesson.mockImplementationOnce(async () => new Promise((resolve) => { finish = () => resolve({ status: "success", message: "저장" }); }));
    render(<LessonReviewForm exerciseLogId={logId} review={null} />);
    fireEvent.change(screen.getByLabelText("오늘 집중한 기술"), { target: { value: "드라이브" } });
    const button = screen.getByRole("button", { name: "레슨 리뷰 저장" });
    fireEvent.click(button);
    expect(await screen.findByRole("button", { name: "저장 중…" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "저장 중…" }));
    expect(mocks.saveLesson).toHaveBeenCalledOnce();
    await act(async () => finish?.());
  });
});
