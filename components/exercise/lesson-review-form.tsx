"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  deleteLessonReviewAction,
  saveLessonReviewAction,
  type ExerciseReviewActionState,
} from "@/app/(app)/exercise-sticker-actions";
import type { ExerciseLessonReviewRow } from "@/types/database";

const initialState: ExerciseReviewActionState = { status: "idle" };

interface LessonReviewFormProps {
  readonly exerciseLogId: string;
  readonly review: ExerciseLessonReviewRow | null;
}

export function LessonReviewForm({ exerciseLogId, review }: LessonReviewFormProps) {
  const [saveState, saveAction, saving] = useActionState(saveLessonReviewAction, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteLessonReviewAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (saveState.status === "success" || deleteState.status === "success") router.refresh();
  }, [deleteState.status, router, saveState.status]);

  return <section className="exercise-review" aria-labelledby={`lesson-review-${exerciseLogId}`}>
    <div className="exercise-review__heading"><h3 id={`lesson-review-${exerciseLogId}`}>레슨 리뷰</h3>{review === null && <p>아직 작성된 레슨 리뷰가 없습니다.</p>}</div>
    <form action={saveAction} className="exercise-review-form" key={`${exerciseLogId}:${review?.updated_at ?? "empty"}`}>
      <input name="exerciseLogId" type="hidden" value={exerciseLogId} />
      <label><span>오늘 집중한 기술</span><input defaultValue={review?.lesson_focus ?? ""} maxLength={200} name="lessonFocus" /></label>
      <label><span>배운 점</span><textarea defaultValue={review?.learned ?? ""} maxLength={1000} name="learned" /></label>
      <label><span>아쉬웠던 점</span><textarea defaultValue={review?.mistakes ?? ""} maxLength={1000} name="mistakes" /></label>
      <label><span>코치 피드백</span><textarea defaultValue={review?.coach_feedback ?? ""} maxLength={1000} name="coachFeedback" /></label>
      <label><span>다음 레슨 목표</span><textarea defaultValue={review?.next_goal ?? ""} maxLength={1000} name="nextGoal" /></label>
      <label><span>자유 메모</span><textarea defaultValue={review?.memo ?? ""} maxLength={2000} name="memo" /></label>
      <div className="exercise-review-form__actions">
        <button className="button button--primary" disabled={saving || deleting} type="submit">{saving ? "저장 중…" : review ? "레슨 리뷰 수정" : "레슨 리뷰 저장"}</button>
        {review && <button className="danger-action" disabled={saving || deleting} formAction={deleteAction} type="submit">{deleting ? "삭제 중…" : "리뷰 삭제"}</button>}
      </div>
      {saveState.status !== "idle" && <p aria-live="polite" className="form-message">{saveState.message}</p>}
      {deleteState.status !== "idle" && <p aria-live="polite" className="form-message">{deleteState.message}</p>}
    </form>
  </section>;
}
