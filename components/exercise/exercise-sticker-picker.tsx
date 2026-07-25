"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  attachExerciseStickerAction,
  type ExerciseCreateActionState,
  type StickerActionState,
  updateExerciseStickerDetailsAction,
} from "@/app/(app)/exercise-sticker-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { ExerciseSticker } from "@/components/exercise/exercise-sticker";
import { exerciseDurationFromEvent } from "@/lib/exercise/domain";
import { exerciseDateKey } from "@/lib/exercise/stickers";
import type { EventRow, ExerciseLogRow, ExerciseRecordType, ExerciseStickerRow } from "@/types/database";

const initialState: ExerciseCreateActionState = { status: "idle" };
const initialUpdateState: StickerActionState = { status: "idle" };
const quickDurations = [30, 60, 90, 120] as const;

function quickLabel(sticker: ExerciseStickerRow): string {
  return sticker.icon_key === "strength" ? "헬스" : sticker.label;
}

type CreatedExerciseLog = { readonly logId: string; readonly recordType: ExerciseRecordType };

interface ExerciseStickerPickerProps {
  readonly date: string;
  readonly event?: EventRow;
  readonly eventId?: string;
  readonly existingLog?: ExerciseLogRow;
  readonly initialRecordType?: ExerciseRecordType;
  readonly initialNote?: string;
  readonly initialWorkoutType?: string;
  readonly logs: readonly ExerciseLogRow[];
  readonly onCreated?: (log: CreatedExerciseLog) => void;
  readonly returnTo?: string;
  readonly stickers: readonly ExerciseStickerRow[];
}

const recordTypes = [
  ["exercise", "일반 운동"],
  ["lesson", "레슨"],
  ["competition", "대회"],
] as const satisfies readonly (readonly [ExerciseRecordType, string])[];

function matchingStickerForEvent(event: EventRow, stickers: readonly ExerciseStickerRow[]): ExerciseStickerRow | undefined {
  const details = event.event_details;
  const workoutType = details?.kind === "workout" ? details.workoutType.trim() : "";
  const candidates = [workoutType, event.title].filter(Boolean);
  return stickers.find((sticker) =>
    candidates.some((candidate) => candidate === sticker.label || candidate.includes(sticker.label)),
  ) ?? stickers[0];
}

function eventScheduleLabel(event: EventRow): string {
  const date = event.start_date.replaceAll("-", ".");
  if (event.is_all_day) return `${date} · 종일`;
  const start = event.start_time?.slice(0, 5);
  const end = event.end_time?.slice(0, 5);
  if (!start) return date;
  return `${date} · ${start}${end ? ` ~ ${end}` : ""}`;
}

function LinkedExerciseRecordForm({
  event,
  existingLog,
  onCreated,
  returnTo,
  stickers,
}: Pick<ExerciseStickerPickerProps, "event" | "existingLog" | "onCreated" | "returnTo" | "stickers"> & { readonly event: EventRow }) {
  const [createState, createAction, createPending] = useActionState(attachExerciseStickerAction, initialState);
  const [updateState, updateAction, updatePending] = useActionState(updateExerciseStickerDetailsAction, initialUpdateState);
  const initialDuration = existingLog?.duration_minutes ?? exerciseDurationFromEvent(event);
  const [duration, setDuration] = useState(initialDuration?.toString() ?? "");
  const router = useRouter();
  const handledCreateState = useRef<ExerciseCreateActionState | null>(null);
  const handledUpdateState = useRef<StickerActionState | null>(null);
  const availableStickers = stickers.filter((sticker) => sticker.icon_key !== "badminton_lesson");
  const matchedSticker = matchingStickerForEvent(event, availableStickers);
  const [stickerId, setStickerId] = useState(existingLog?.sticker_id ?? matchedSticker?.id ?? "");
  const recordType: ExerciseRecordType = event.event_type === "tournament" ? "competition" : "exercise";
  const pending = createPending || updatePending;
  const durationNumber = Number(duration);
  const durationValid = Number.isInteger(durationNumber) && durationNumber >= 1 && durationNumber <= 1440;

  useEffect(() => {
    if (createState.status !== "success" || handledCreateState.current === createState) return;
    handledCreateState.current = createState;
    if (createState.outcome === "created") {
      onCreated?.({ logId: createState.logId, recordType: createState.recordType });
    }
    if (returnTo) router.push(returnTo);
    else router.refresh();
  }, [createState, onCreated, returnTo, router]);

  useEffect(() => {
    if (updateState.status !== "success" || handledUpdateState.current === updateState) return;
    handledUpdateState.current = updateState;
    if (returnTo) router.push(returnTo);
    else router.refresh();
  }, [returnTo, router, updateState]);

  const state = existingLog ? updateState : createState;
  return <form action={existingLog ? updateAction : createAction} className="exercise-record-form exercise-record-form--linked">
    <div className="linked-exercise-summary">
      <span className="linked-exercise-summary__eyebrow">연결된 운동 일정</span>
      <h3>{event.title}</h3>
      <p>{eventScheduleLabel(event)}</p>
      {event.location && <p>{event.location}</p>}
    </div>
    <input name="eventId" type="hidden" value={event.id} />
    <input name="exerciseDate" type="hidden" value={event.start_date} />
    <input name="recordType" type="hidden" value={recordType} />
    {existingLog && <input name="logId" type="hidden" value={existingLog.id} />}
    <label>
      <span>운동 종류</span>
      <select aria-label="운동 종류" name="stickerId" onChange={(changeEvent) => setStickerId(changeEvent.target.value)} required value={stickerId}>
        {availableStickers.map((sticker) => <option key={sticker.id} value={sticker.id}>{quickLabel(sticker)}</option>)}
      </select>
    </label>
    <div className="linked-exercise-duration">
      <label>
        <span>운동 시간(분)</span>
        <input
          aria-label="운동 시간(분)"
          inputMode="numeric"
          max="1440"
          min="1"
          name="durationMinutes"
          onChange={(changeEvent) => setDuration(changeEvent.target.value)}
          placeholder="분"
          required
          type="number"
          value={duration}
        />
      </label>
      <div aria-label="빠른 운동 시간 선택" className="linked-exercise-duration__quick">
        {quickDurations.map((minutes) => <button
          aria-pressed={duration === minutes.toString()}
          key={minutes}
          onClick={() => setDuration(minutes.toString())}
          type="button"
        >{minutes}분</button>)}
      </div>
      {!initialDuration && !duration && <p className="field-hint">일정에 종료 시간이 없어 운동 시간을 선택해 주세요.</p>}
    </div>
    <label>
      <span>메모(선택)</span>
      <textarea
        defaultValue={existingLog?.note ?? event.memo ?? ""}
        maxLength={500}
        name="note"
        placeholder="예) 레슨, 게임 4세트, 드롭과 헤어핀 연습"
        rows={3}
      />
    </label>
    <button className="button button--primary" disabled={pending || !stickerId || !durationValid} type="submit">
      {pending ? "저장 중…" : existingLog ? "수정 저장" : "운동 기록 저장"}
    </button>
    {state.message && <p aria-live="polite" className={`sticker-toast${state.status === "error" ? " sticker-toast--error" : ""}`}>{state.message}</p>}
  </form>;
}

function ManualExerciseStickerPicker({
  date,
  eventId,
  initialNote,
  initialRecordType = "exercise",
  initialWorkoutType,
  logs,
  onCreated,
  stickers,
}: ExerciseStickerPickerProps) {
  const [state, action, pending] = useActionState(attachExerciseStickerAction, initialState);
  const [recordType, setRecordType] = useState<ExerciseRecordType>(initialRecordType);
  const selectableStickers = stickers.filter((sticker) => sticker.icon_key !== "badminton_lesson");
  const existingStickerIds = new Set(logs.filter((log) => exerciseDateKey(log.exercise_date) === date && log.record_type === recordType).map((log) => log.sticker_id));
  const matchingSticker = initialWorkoutType
    ? selectableStickers.find((sticker) => sticker.label === initialWorkoutType)
    : undefined;
  const firstAvailable = matchingSticker && !existingStickerIds.has(matchingSticker.id)
    ? matchingSticker
    : selectableStickers.find((sticker) => !existingStickerIds.has(sticker.id));
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
    {eventId && <input name="eventId" type="hidden" value={eventId} />}
    <label><span>날짜</span><CalendarDateInput ariaLabel="운동 날짜" defaultValue={date} name="exerciseDate" required /></label>
    <label><span>메모(선택)</span><textarea defaultValue={initialNote} maxLength={500} name="note" placeholder="기억하고 싶은 한 줄을 남겨보세요." /></label>
    <button className="button button--primary" disabled={pending || !selectedStickerId} type="submit">{pending ? "저장 중…" : "운동 기록 저장"}</button>
    {visibleMessage?.message && <p aria-live="polite" className={`sticker-toast${visibleMessage.status === "error" ? " sticker-toast--error" : ""}`}>{visibleMessage.message}</p>}
  </form>;
}

export function ExerciseStickerPicker(props: ExerciseStickerPickerProps) {
  if (props.event?.event_type === "workout") {
    return <LinkedExerciseRecordForm
      event={props.event}
      stickers={props.stickers}
      {...(props.existingLog ? { existingLog: props.existingLog } : {})}
      {...(props.onCreated ? { onCreated: props.onCreated } : {})}
      {...(props.returnTo ? { returnTo: props.returnTo } : {})}
    />;
  }
  return <ManualExerciseStickerPicker {...props} />;
}
