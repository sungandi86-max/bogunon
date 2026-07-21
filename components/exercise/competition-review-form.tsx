"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  deleteCompetitionReviewAction,
  saveCompetitionReviewAction,
  type ExerciseReviewActionState,
} from "@/app/(app)/exercise-sticker-actions";
import type { ExerciseCompetitionReviewRow } from "@/types/database";

const initialState: ExerciseReviewActionState = { status: "idle" };

interface CompetitionReviewFormProps {
  readonly exerciseLogId: string;
  readonly review: ExerciseCompetitionReviewRow | null;
}

export function CompetitionReviewForm({ exerciseLogId, review }: CompetitionReviewFormProps) {
  const [saveState, saveAction, saving] = useActionState(saveCompetitionReviewAction, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteCompetitionReviewAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (saveState.status === "success" || deleteState.status === "success") router.refresh();
  }, [deleteState.status, router, saveState.status]);

  return <section className="exercise-review" aria-labelledby={`competition-review-${exerciseLogId}`}>
    <div className="exercise-review__heading"><h3 id={`competition-review-${exerciseLogId}`}>대회 리뷰</h3>{review === null && <p>아직 작성된 대회 리뷰가 없습니다.</p>}</div>
    <form action={saveAction} className="exercise-review-form" key={`${exerciseLogId}:${review?.updated_at ?? "empty"}`}>
      <input name="exerciseLogId" type="hidden" value={exerciseLogId} />
      <label><span>대회명</span><input defaultValue={review?.competition_name ?? ""} maxLength={200} name="competitionName" /></label>
      <div className="exercise-review-form__pair"><label><span>장소</span><input defaultValue={review?.location ?? ""} maxLength={200} name="location" /></label><label><span>종목</span><input defaultValue={review?.event_category ?? ""} maxLength={200} name="eventCategory" /></label></div>
      <div className="exercise-review-form__pair"><label><span>등급</span><input defaultValue={review?.grade ?? ""} maxLength={100} name="grade" /></label><label><span>파트너</span><input defaultValue={review?.partner ?? ""} maxLength={100} name="partner" /></label></div>
      <div className="exercise-review-form__scores"><label><span>전체 경기</span><input defaultValue={review?.total_games ?? ""} inputMode="numeric" max="1000" min="0" name="totalGames" type="number" /></label><label><span>승</span><input defaultValue={review?.wins ?? ""} inputMode="numeric" max="1000" min="0" name="wins" type="number" /></label><label><span>패</span><input defaultValue={review?.losses ?? ""} inputMode="numeric" max="1000" min="0" name="losses" type="number" /></label></div>
      <label><span>최종 결과</span><input defaultValue={review?.final_result ?? ""} maxLength={200} name="finalResult" /></label>
      <label><span>잘한 점</span><textarea defaultValue={review?.strengths ?? ""} maxLength={1000} name="strengths" /></label>
      <label><span>개선할 점</span><textarea defaultValue={review?.improvements ?? ""} maxLength={1000} name="improvements" /></label>
      <label><span>다음 목표</span><textarea defaultValue={review?.next_goal ?? ""} maxLength={1000} name="nextGoal" /></label>
      <label><span>자유 메모</span><textarea defaultValue={review?.memo ?? ""} maxLength={2000} name="memo" /></label>
      <div className="exercise-review-form__actions">
        <button className="button button--primary" disabled={saving || deleting} type="submit">{saving ? "저장 중…" : review ? "대회 리뷰 수정" : "대회 리뷰 저장"}</button>
        {review && <button className="danger-action" disabled={saving || deleting} formAction={deleteAction} type="submit">{deleting ? "삭제 중…" : "리뷰 삭제"}</button>}
      </div>
      {saveState.status !== "idle" && <p aria-live="polite" className="form-message">{saveState.message}</p>}
      {deleteState.status !== "idle" && <p aria-live="polite" className="form-message">{deleteState.message}</p>}
    </form>
  </section>;
}
