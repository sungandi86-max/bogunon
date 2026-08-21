"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { removeExerciseStickerAction, updateExerciseStickerDetailsAction, type StickerActionState } from "@/app/(app)/exercise-sticker-actions";
import type { ActiveExerciseReview } from "@/components/exercise/exercise-review-panel";
import { ExerciseRecordBadge } from "@/components/exercise/exercise-record-badge";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import type { ExerciseLogWithReview } from "@/lib/exercise/repository";
import type { ExerciseStickerRow } from "@/types/database";

const initialState: StickerActionState = { status: "idle" };

interface ExerciseLogDetailsProps {
  readonly logs: readonly ExerciseLogWithReview[];
  readonly onOpenReview: ((review: ActiveExerciseReview, trigger: HTMLButtonElement) => void) | undefined;
  readonly stickers: readonly ExerciseStickerRow[];
}

function reviewHighlights(log: ExerciseLogWithReview): readonly string[] {
  if (log.record_type === "lesson") return [log.lessonReview?.lesson_focus ?? log.note ?? "아직 작성된 레슨 리뷰가 없습니다."];
  if (log.record_type === "competition") {
    return [
      log.competitionReview?.event_category ?? log.competitionReview?.competition_name ?? log.note ?? "아직 작성된 대회 리뷰가 없습니다.",
      log.competitionReview?.final_result,
    ].filter((value): value is string => Boolean(value));
  }
  return [log.note].filter((value): value is string => Boolean(value));
}

export function ExerciseLogDetails({ logs, onOpenReview, stickers }: ExerciseLogDetailsProps) {
  const [state, action, pending] = useActionState(updateExerciseStickerDetailsAction, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeExerciseStickerAction, initialState);
  const [editLog, setEditLog] = useState<ExerciseLogWithReview | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const updateWasPending = useRef(false);
  const removeWasPending = useRef(false);

  useEffect(() => {
    if (pending) updateWasPending.current = true;
    if (!pending && updateWasPending.current && state.status === "success") {
      updateWasPending.current = false;
      setEditLog(null);
    }
  }, [pending, state.status]);
  useEffect(() => {
    if (removePending) removeWasPending.current = true;
    if (!removePending && removeWasPending.current && removeState.status === "success") {
      removeWasPending.current = false;
      setEditLog(null);
    }
  }, [removePending, removeState.status]);

  if (!logs.length) return <p className="exercise-day-empty">이 날짜에는 아직 운동 스티커가 없습니다.</p>;

  const selectedSticker = editLog ? stickers.find((item) => item.id === editLog.sticker_id) : undefined;
  const reviewTarget = editLog && editLog.record_type !== "exercise"
    ? { logId: editLog.id, recordType: editLog.record_type }
    : null;
  return <>
    <div className="exercise-day-logs">{logs.map((log) => {
      const sticker = stickers.find((item) => item.id === log.sticker_id);
      if (!sticker) return null;
      const highlights = reviewHighlights(log);
      return <article className="exercise-log-detail" key={log.id}>
        <button className="exercise-log-detail__summary" onClick={(event) => { triggerRef.current = event.currentTarget; setEditLog(log); }} type="button">
          <ExerciseSticker sticker={sticker} size="sm" />
          <span className="exercise-log-summary">
            <span className="exercise-log-summary__heading"><strong>{sticker.label}</strong><ExerciseRecordBadge recordType={log.record_type} /></span>
            <span className="exercise-log-summary__lines" aria-label="기록 요약">{highlights.map((line) => <span className="exercise-log-summary__line" key={line}>{line}</span>)}</span>
          </span>
          <time dateTime={log.exercise_date.slice(0, 10)}>{log.exercise_date.slice(0, 10).replaceAll("-", ".")}</time>
        </button>
      </article>;
    })}</div>
    <ResponsiveDetailPanel onClose={() => setEditLog(null)} open={Boolean(editLog)} panelClassName="exercise-log-edit-modal" presentation="modal" returnFocusRef={triggerRef} title="운동 기록 수정">
      {editLog && selectedSticker && <form action={action}>
        <input name="logId" type="hidden" value={editLog.id} />
        <label>운동 시간(분)<input defaultValue={editLog.duration_minutes ?? ""} inputMode="numeric" max="1440" min="1" name="durationMinutes" type="number" /></label>
        <label>짧은 메모<textarea defaultValue={editLog.note ?? ""} maxLength={500} name="note" placeholder="기억하고 싶은 한 줄만 남겨보세요." /></label>
        {reviewTarget && <button className="button button--secondary" onClick={(event) => onOpenReview?.(reviewTarget, event.currentTarget)} type="button">{reviewTarget.recordType === "lesson" ? "레슨 리뷰 열기" : "대회 리뷰 열기"}</button>}
        <div className="exercise-log-detail__actions"><button className="button button--secondary" disabled={pending} type="submit">{pending ? "저장 중…" : "수정 저장"}</button><button className="danger-action" disabled={removePending} formAction={removeAction} type="submit">{removePending ? "삭제 중…" : "삭제"}</button></div>
        {state.message && <p aria-live="polite" className={state.status === "error" ? "form-message is-error" : "form-message"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
        {removeState.message && <p aria-live="polite" className={removeState.status === "error" ? "form-message is-error" : "form-message"} role={removeState.status === "error" ? "alert" : "status"}>{removeState.message}</p>}
      </form>}
    </ResponsiveDetailPanel>
  </>;
}