"use client";

import { useActionState } from "react";

import { removeExerciseStickerAction, updateExerciseStickerDetailsAction, type StickerActionState } from "@/app/(app)/exercise-sticker-actions";
import type { ActiveExerciseReview } from "@/components/exercise/exercise-review-panel";
import { ExerciseRecordBadge } from "@/components/exercise/exercise-record-badge";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
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
  if (!logs.length) return <p className="exercise-day-empty">이 날짜에는 아직 운동 스티커가 없습니다.</p>;

  return <div className="exercise-day-logs">{logs.map((log) => {
    const sticker = stickers.find((item) => item.id === log.sticker_id);
    if (!sticker) return null;
    const reviewTarget: ActiveExerciseReview | null = log.record_type === "exercise" ? null : { logId: log.id, recordType: log.record_type };
    const highlights = reviewHighlights(log);
    return <details className="exercise-log-detail" key={log.id}>
      <summary className="exercise-log-detail__summary">
        <ExerciseSticker sticker={sticker} size="sm" />
        <span className="exercise-log-summary">
          <span className="exercise-log-summary__heading"><strong>{sticker.label}</strong><ExerciseRecordBadge recordType={log.record_type} /></span>
          <span className="exercise-log-summary__lines" aria-label="기록 요약">{highlights.map((line) => <span className="exercise-log-summary__line" key={line}>{line}</span>)}</span>
        </span>
        <time dateTime={log.exercise_date.slice(0, 10)}>{log.exercise_date.slice(0, 10).replaceAll("-", ".")}</time>
      </summary>
      <form action={action}>
        <input name="logId" type="hidden" value={log.id} />
        <label>운동 시간(분)<input defaultValue={log.duration_minutes ?? ""} inputMode="numeric" max="1440" min="1" name="durationMinutes" type="number" /></label>
        <label>짧은 메모<textarea defaultValue={log.note ?? ""} maxLength={500} name="note" placeholder="기억하고 싶은 한 줄만 남겨보세요." /></label>
        {reviewTarget && <button className="button button--secondary" onClick={(event) => onOpenReview?.(reviewTarget, event.currentTarget)} type="button">{reviewTarget.recordType === "lesson" ? "레슨 리뷰 열기" : "대회 리뷰 열기"}</button>}
        <div className="exercise-log-detail__actions"><button className="button button--secondary" disabled={pending} type="submit">수정 저장</button><button className="danger-action" disabled={removePending} formAction={removeAction} type="submit">삭제</button></div>
        {state.message && <p aria-live="polite" className="form-message">{state.message}</p>}
        {removeState.message && <p aria-live="polite" className="form-message">{removeState.message}</p>}
      </form>
    </details>;
  })}</div>;
}
