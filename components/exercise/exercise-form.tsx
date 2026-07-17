"use client";

import { Dumbbell } from "lucide-react";
import type { RefObject } from "react";
import { useActionState, useEffect, useState } from "react";

import { saveExerciseAction } from "@/app/(app)/exercise-actions";
import type { ExerciseActionState } from "@/app/(app)/exercise-actions";
import {
  EXERCISE_INTENSITIES,
  EXERCISE_RECURRENCES,
  EXERCISE_TYPES,
  exerciseIntensitySchema,
  exerciseTypeSchema,
  parseExerciseQuickInput,
} from "@/lib/exercise/domain";
import type { ExerciseIntensity, ExerciseType } from "@/lib/exercise/domain";

const initialState: ExerciseActionState = { status: "idle" };

interface ExerciseFormProps {
  readonly onSaved: () => void;
  readonly today: string;
  readonly typeRef: RefObject<HTMLSelectElement | null>;
}

export function ExerciseForm({ onSaved, today, typeRef }: ExerciseFormProps) {
  const [state, action] = useActionState(saveExerciseAction, initialState);
  const [quickText, setQuickText] = useState("");
  const [exerciseType, setExerciseType] = useState<ExerciseType>("badminton");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("18:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [intensity, setIntensity] = useState<ExerciseIntensity>("moderate");
  const [recurrence, setRecurrence] = useState("");
  const [quickApplied, setQuickApplied] = useState(false);

  useEffect(() => { if (state.status === "success") onSaved(); }, [onSaved, state.status]);

  function applyQuickInput(): void {
    const result = parseExerciseQuickInput(quickText, new Date(`${today}T09:00:00+09:00`));
    setExerciseType(result.exerciseType);
    setDate(result.date);
    setStartTime(result.startTime);
    setDurationMinutes(result.durationMinutes);
    setIntensity(result.intensity);
    setRecurrence(result.recurrence ?? "");
    setQuickApplied(true);
  }

  return <form action={action} className="exercise-form" id="exercise-create-form">
    <section className="quick-input-box" aria-labelledby="exercise-quick-input-title">
      <div><Dumbbell aria-hidden="true" size={17} /><strong id="exercise-quick-input-title">한국어 빠른 입력</strong></div>
      <textarea onChange={(event) => { setQuickText(event.target.value); setQuickApplied(false); }} placeholder="예: 오늘 저녁 7시 배드민턴 2시간" value={quickText} />
      <button className="button button--secondary" disabled={!quickText.trim()} onClick={applyQuickInput} type="button">입력 해석</button>
      {quickApplied && <p className="exercise-quick-result" role="status">운동 정보에 입력 결과를 반영했습니다.</p>}
    </section>
    <div className="exercise-form__grid">
      <div className="field"><label className="field-label" htmlFor="exercise-type">운동 종류</label><select id="exercise-type" name="exerciseType" onChange={(event) => setExerciseType(exerciseTypeSchema.parse(event.target.value))} ref={typeRef} value={exerciseType}>{EXERCISE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="field"><label className="field-label" htmlFor="exercise-date">날짜</label><input id="exercise-date" name="date" onChange={(event) => setDate(event.target.value)} required type="date" value={date} /></div>
      <div className="field"><label className="field-label" htmlFor="exercise-start-time">시작 시간</label><input id="exercise-start-time" name="startTime" onChange={(event) => setStartTime(event.target.value)} required type="time" value={startTime} /></div>
      <div className="field"><label className="field-label" htmlFor="exercise-duration">운동 시간(분)</label><input id="exercise-duration" max="1440" min="1" name="durationMinutes" onChange={(event) => setDurationMinutes(Number(event.target.value))} required type="number" value={durationMinutes} /></div>
      <div className="field exercise-form__wide"><label className="field-label" htmlFor="exercise-location">장소</label><input id="exercise-location" maxLength={100} name="location" placeholder="예: 학교 체육관" /></div>
      <div className="field"><label className="field-label" htmlFor="exercise-intensity">강도</label><select id="exercise-intensity" name="intensity" onChange={(event) => setIntensity(exerciseIntensitySchema.parse(event.target.value))} value={intensity}>{EXERCISE_INTENSITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="field"><label className="field-label" htmlFor="exercise-recurrence">반복</label><select id="exercise-recurrence" name="recurrence" onChange={(event) => setRecurrence(event.target.value)} value={recurrence}>{EXERCISE_RECURRENCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="field exercise-form__wide"><label className="field-label" htmlFor="exercise-memo">메모</label><textarea id="exercise-memo" maxLength={1000} name="memo" placeholder="운동 준비물이나 간단한 기록을 남겨보세요." /></div>
    </div>
    {state.message && <p className={`form-message${state.status === "error" ? " form-message--error" : ""}`} role="status">{state.message}</p>}
  </form>;
}
