"use client";

import { Copy } from "lucide-react";
import { useActionState, useState } from "react";

import {
  copyEventAction,
  type EventCopyActionState,
} from "@/app/(app)/calendar-event-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { addCalendarDays } from "@/lib/work-items/date";

const initialState: EventCopyActionState = { status: "idle" };

export function EventCopyMenu({
  eventId,
  startDate,
}: {
  readonly eventId: string;
  readonly startDate: string;
}) {
  const [directDate, setDirectDate] = useState(startDate);
  const [state, action, pending] = useActionState(copyEventAction, initialState);

  return <details className="event-copy-menu">
    <summary><Copy aria-hidden="true" size={16} />복사</summary>
    <form action={action} className="duplicate-menu">
      <input name="id" type="hidden" value={eventId} />
      <div className="event-copy-menu__presets">
        <button disabled={pending} name="targetDate" type="submit" value={startDate}>같은 날짜에 복사</button>
        <button disabled={pending} name="targetDate" type="submit" value={addCalendarDays(startDate, 1)}>다음 날로 복사</button>
        <button disabled={pending} name="targetDate" type="submit" value={addCalendarDays(startDate, 7)}>다음 주 같은 요일로 복사</button>
      </div>
      <label>
        날짜 선택
        <CalendarDateInput
          ariaLabel="복사할 날짜 직접 선택"
          name="directDate"
          onValueChange={setDirectDate}
          value={directDate}
        />
      </label>
      <button className="button button--secondary" disabled={pending} name="targetDate" type="submit" value={directDate}>
        {pending ? "복사 중…" : "선택한 날짜로 복사"}
      </button>
      {state.message && <p
        aria-live="polite"
        className={state.status === "error" ? "form-message form-message--error" : "form-message"}
        role={state.status === "error" ? "alert" : "status"}
      >{state.message}</p>}
    </form>
  </details>;
}
