"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  attachExerciseStickerAction,
  removeExerciseStickerAction,
  type StickerActionState,
} from "@/app/(app)/exercise-sticker-actions";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import type { ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

const initialState: StickerActionState = { status: "idle" };

export function ExerciseStickerPicker({ date, logs, stickers, compact = false }: { readonly date: string; readonly logs: readonly ExerciseLogRow[]; readonly stickers: readonly ExerciseStickerRow[]; readonly compact?: boolean }) {
  const [saveState, saveAction, savePending] = useActionState(attachExerciseStickerAction, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeExerciseStickerAction, initialState);
  const router = useRouter();
  const state = removeState.status !== "idle" ? removeState : saveState;

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state]);

  const visibleStickers = compact ? stickers.slice(0, 4) : stickers;
  return (
    <div className={compact ? "exercise-picker exercise-picker--compact" : "exercise-picker"}>
      <div className="exercise-picker__grid">
        {visibleStickers.map((sticker) => {
          const existing = logs.find((log) => log.sticker_id === sticker.id && log.exercise_date === date);
          return existing ? (
            <form action={removeAction} key={sticker.id} onSubmit={(event) => { if (!window.confirm(`${sticker.label} 스티커를 이 날짜에서 제거할까요?`)) event.preventDefault(); }}>
              <input name="logId" type="hidden" value={existing.id} />
              <button aria-label={`${sticker.label} 스티커 제거`} disabled={removePending} type="submit">
                <ExerciseSticker selected sticker={sticker} size={compact ? "md" : "lg"} />
                <span>{sticker.label}</span>
              </button>
            </form>
          ) : (
            <form action={saveAction} key={sticker.id}>
              <input name="exerciseDate" type="hidden" value={date} />
              <button aria-label={`${date}에 ${sticker.label} 스티커 붙이기`} disabled={savePending} name="stickerId" type="submit" value={sticker.id}>
                <ExerciseSticker sticker={sticker} size={compact ? "md" : "lg"} />
                <span>{sticker.label}</span>
              </button>
            </form>
          );
        })}
      </div>
      {state.message && <p aria-live="polite" className={`sticker-toast${state.status === "error" ? " sticker-toast--error" : ""}`}>{state.message}</p>}
    </div>
  );
}
