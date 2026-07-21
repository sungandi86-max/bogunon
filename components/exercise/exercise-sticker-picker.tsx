"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { attachExerciseStickerAction, type ExerciseCreateActionState } from "@/app/(app)/exercise-sticker-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { exerciseDateKey } from "@/lib/exercise/stickers";
import type { ExerciseLogRow, ExerciseRecordType, ExerciseStickerRow } from "@/types/database";

const initialState: ExerciseCreateActionState = { status: "idle" };

function quickLabel(sticker: ExerciseStickerRow): string {
  return sticker.icon_key === "strength" ? "헬스" : sticker.label;
}

type CreatedExerciseLog = { readonly logId: string; readonly recordType: ExerciseRecordType };

interface ExerciseStickerPickerProps {
  readonly date: string;
  readonly logs: readonly ExerciseLogRow[];
  readonly onCreated?: (log: CreatedExerciseLog) => void;
  readonly stickers: readonly ExerciseStickerRow[];
}

const recordTypes = [
  ["exercise", "일반 운동"],
  ["lesson", "레슨"],
  ["competition", "대회"],
] as const satisfies readonly (readonly [ExerciseRecordType, string])[];

export function ExerciseStickerPicker({ date, logs, onCreated, stickers }: ExerciseStickerPickerProps) {
  const [state, action, pending] = useActionState(attachExerciseStickerAction, initialState);
  const [recordType, setRecordType] = useState<ExerciseRecordType>("exercise");
  const selectableStickers = stickers.filter((sticker) => sticker.icon_key !== "badminton_lesson");
  const existingStickerIds = new Set(logs.filter((log) => exerciseDateKey(log.exercise_date) === date && log.record_type === recordType).map((log) => log.sticker_id));
  const firstAvailable = selectableStickers.find((sticker) => !existingStickerIds.has(sticker.id));
  const [preferredStickerId, setPreferredStickerId] = useState(firstAvailable?.id ?? "");
  const selectedStickerId = preferredStickerId && selectableStickers.some((sticker) => sticker.id === preferredStickerId) && !existingStickerIds.has(preferredStickerId)
    ? preferredStickerId
    : firstAvailable?.id ?? "";
  const [dismissedMessage, setDismissedMessage] = useState<ExerciseCreateActionState | null>(null);
  const handledMessage = useRef<ExerciseCreateActionState | null>(null);
  const router = useRouter();

  function changeRecordType(nextRecordType: ExerciseRecordType): void {
    setRecordType(nextRecordType);
  }

  useEffect(() => {
    if (!state.message || state.status !== "success") return;
    if (handledMessage.current !== state) {
      handledMessage.current = state;
      router.refresh();
      if (state.outcome === "created") onCreated?.({ logId: state.logId, recordType: state.recordType });
    }
    const timeout = window.setTimeout(() => setDismissedMessage(state), 3200);
    return () => window.clearTimeout(timeout);
  }, [onCreated, router, state]);

  const visibleMessage = state !== dismissedMessage ? state : null;
  return <form action={action} className="exercise-record-form">
    <fieldset>
      <legend>운동 종류와 스티커</legend>
      <div className="exercise-picker__grid">{selectableStickers.map((sticker) => {
        const alreadyRecorded = existingStickerIds.has(sticker.id);
        const selected = selectedStickerId === sticker.id;
        return <button aria-label={`${quickLabel(sticker)} 선택${alreadyRecorded ? ", 이미 기록됨" : ""}`} aria-pressed={selected} disabled={alreadyRecorded} key={sticker.id} onClick={() => setPreferredStickerId(sticker.id)} type="button"><ExerciseSticker disabled={alreadyRecorded} selected={selected} sticker={sticker} size="md" /><span>{quickLabel(sticker)}</span>{alreadyRecorded && <small>기록됨</small>}</button>;
      })}</div>
    </fieldset>
    <fieldset className="exercise-record-type" role="radiogroup" aria-label="기록 유형">
      <legend>기록 유형</legend>
      <div className="exercise-record-type__options">{recordTypes.map(([value, label]) => <label key={value}><input checked={recordType === value} name="recordType" onChange={() => changeRecordType(value)} type="radio" value={value} /><span>{label}</span></label>)}</div>
    </fieldset>
    <input name="stickerId" type="hidden" value={selectedStickerId} />
    <label><span>날짜</span><CalendarDateInput ariaLabel="운동 날짜" defaultValue={date} name="exerciseDate" required /></label>
    <label><span>메모(선택)</span><textarea maxLength={500} name="note" placeholder="기억하고 싶은 한 줄을 남겨보세요." /></label>
    <button className="button button--primary" disabled={pending || !selectedStickerId} type="submit">{pending ? "저장 중…" : "운동 기록 저장"}</button>
    {visibleMessage?.message && <p aria-live="polite" className={`sticker-toast${visibleMessage.status === "error" ? " sticker-toast--error" : ""}`}>{visibleMessage.message}</p>}
  </form>;
}
