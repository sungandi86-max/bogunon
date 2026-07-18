"use client";

import { useActionState } from "react";

import { removeExerciseStickerAction, updateExerciseStickerDetailsAction, type StickerActionState } from "@/app/(app)/exercise-sticker-actions";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import type { ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

const initialState: StickerActionState = { status: "idle" };

export function ExerciseLogDetails({ logs, stickers }: { readonly logs: readonly ExerciseLogRow[]; readonly stickers: readonly ExerciseStickerRow[] }) {
  const [state, action, pending] = useActionState(updateExerciseStickerDetailsAction, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeExerciseStickerAction, initialState);
  if (!logs.length) return <p className="exercise-day-empty">이 날짜에는 아직 운동 스티커가 없습니다.</p>;
  return <div className="exercise-day-logs">{logs.map((log) => {
    const sticker = stickers.find((item) => item.id === log.sticker_id);
    if (!sticker) return null;
    return <details className="exercise-log-detail" key={log.id}><summary><ExerciseSticker sticker={sticker} size="sm" /><strong>{sticker.label} 했다!</strong><span>{log.exercise_date.slice(0, 10)}</span></summary><form action={action}><input name="logId" type="hidden" value={log.id} /><label>운동 시간(분)<input defaultValue={log.duration_minutes ?? ""} inputMode="numeric" max="1440" min="1" name="durationMinutes" type="number" /></label><label>짧은 메모<textarea defaultValue={log.note ?? ""} maxLength={500} name="note" placeholder="기억하고 싶은 한 줄만 남겨보세요." /></label><div className="exercise-log-detail__actions"><button className="button button--secondary" disabled={pending} type="submit">수정 저장</button><button className="danger-action" disabled={removePending} formAction={removeAction} type="submit">삭제</button></div>{state.message && <p aria-live="polite" className="form-message">{state.message}</p>}{removeState.message && <p aria-live="polite" className="form-message">{removeState.message}</p>}</form></details>;
  })}</div>;
}
