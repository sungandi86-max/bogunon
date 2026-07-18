"use client";

import { useActionState, useEffect } from "react";

import { moveCalendarItemAction, type WorkItemActionState } from "@/app/(app)/work-item-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import type { MovableCalendarItem } from "@/components/calendar/calendar-entry";

const initialState: WorkItemActionState = { status: "idle" };

export function CalendarMovePanel({ move, newDate, onComplete }: { readonly move: MovableCalendarItem; readonly newDate?: string | undefined; readonly onComplete: () => void }) {
  const [state, action, pending] = useActionState(moveCalendarItemAction, initialState);
  const recurring = Boolean(move.item.recurrence_frequency);
  useEffect(() => { if (state.status === "success") onComplete(); }, [onComplete, state.status]);
  return <form action={action} className="calendar-move-form">
    <input name="id" type="hidden" value={move.item.id} /><input name="kind" type="hidden" value={move.kind} />
    <div className="calendar-move-summary"><span>현재 날짜</span><strong>{move.date}</strong><span>새 날짜</span><CalendarDateInput defaultValue={newDate ?? move.date} name="newDate" required /></div>
    {recurring && <fieldset><legend>반복 일정 이동 범위</legend><label><input defaultChecked name="scope" type="radio" value="instance" />이 일정만</label><label><input name="scope" type="radio" value="following" />이 일정과 이후 일정</label><label><input name="scope" type="radio" value="series" />전체 반복 일정</label></fieldset>}
    {!recurring && <input name="scope" type="hidden" value="instance" />}
    {state.message && <p className={`form-message${state.status === "error" ? " is-error" : ""}`} role="status">{state.message}</p>}
    <button className="button button--primary" disabled={pending} type="submit">{pending ? "변경 중…" : "날짜 변경"}</button>
  </form>;
}
