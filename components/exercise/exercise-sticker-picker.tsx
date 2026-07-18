"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { attachExerciseStickerAction, type StickerActionState } from "@/app/(app)/exercise-sticker-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { exerciseDateKey } from "@/lib/exercise/stickers";
import type { ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

const initialState: StickerActionState = { status: "idle" };

function quickLabel(sticker: ExerciseStickerRow): string {
  return sticker.icon_key === "strength" ? "헬스" : sticker.label;
}

export function ExerciseStickerPicker({ date, logs, stickers }: { readonly date: string; readonly logs: readonly ExerciseLogRow[]; readonly stickers: readonly ExerciseStickerRow[] }) {
  const [state, action, pending] = useActionState(attachExerciseStickerAction, initialState);
  const existingStickerIds = new Set(logs.filter((log) => exerciseDateKey(log.exercise_date) === date).map((log) => log.sticker_id));
  const firstAvailable = stickers.find((sticker) => !existingStickerIds.has(sticker.id));
  const [selectedStickerId, setSelectedStickerId] = useState(firstAvailable?.id ?? "");
  const [dismissedMessage, setDismissedMessage] = useState<StickerActionState | null>(null);
  const handledMessage = useRef<StickerActionState | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state.message || state.status !== "success") return;
    if (handledMessage.current !== state) {
      handledMessage.current = state;
      router.refresh();
    }
    const timeout = window.setTimeout(() => setDismissedMessage(state), 3200);
    return () => window.clearTimeout(timeout);
  }, [router, state]);

  const visibleMessage = state !== dismissedMessage ? state : null;
  return <form action={action} className="exercise-record-form">
    <fieldset>
      <legend>운동 종류와 스티커</legend>
      <div className="exercise-picker__grid">{stickers.map((sticker) => {
        const alreadyRecorded = existingStickerIds.has(sticker.id);
        const selected = selectedStickerId === sticker.id;
        return <button aria-label={`${quickLabel(sticker)} 선택${alreadyRecorded ? ", 이미 기록됨" : ""}`} aria-pressed={selected} disabled={alreadyRecorded} key={sticker.id} onClick={() => setSelectedStickerId(sticker.id)} type="button"><ExerciseSticker disabled={alreadyRecorded} selected={selected} sticker={sticker} size="md" /><span>{quickLabel(sticker)}</span>{alreadyRecorded && <small>기록됨</small>}</button>;
      })}</div>
    </fieldset>
    <input name="stickerId" type="hidden" value={selectedStickerId} />
    <label><span>날짜</span><CalendarDateInput ariaLabel="운동 날짜" defaultValue={date} name="exerciseDate" required /></label>
    <label className="exercise-completed"><input defaultChecked name="completed" required type="checkbox" />운동 완료</label>
    <label><span>운동 시간(선택)</span><input inputMode="numeric" max="1440" min="1" name="durationMinutes" placeholder="예: 60" type="number" /></label>
    <label><span>메모(선택)</span><textarea maxLength={500} name="note" placeholder="기억하고 싶은 한 줄을 남겨보세요." /></label>
    <button className="button button--primary" disabled={pending || !selectedStickerId} type="submit">{pending ? "저장 중…" : "운동 기록 저장"}</button>
    {visibleMessage?.message && <p aria-live="polite" className={`sticker-toast${visibleMessage.status === "error" ? " sticker-toast--error" : ""}`}>{visibleMessage.message}</p>}
  </form>;
}
