"use client";

import { Copy } from "lucide-react";
import { useActionState, useRef, useState } from "react";

import { copyEventAction, type EventCopyActionState } from "@/app/(app)/calendar-event-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { ResponsiveDetailPanel } from "@/components/layout/responsive-detail-panel";
import { addCalendarDays } from "@/lib/work-items/date";

const initialState: EventCopyActionState = { status: "idle" };

export function EventCopyMenu({ eventId, startDate }: { readonly eventId: string; readonly startDate: string }) {
  const [open, setOpen] = useState(false);
  const [directDate, setDirectDate] = useState(startDate);
  const [state, action, pending] = useActionState(async (current: EventCopyActionState, formData: FormData) => {
    const result = await copyEventAction(current, formData);
    if (result.status === "success") setOpen(false);
    return result;
  }, initialState);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = () => setOpen(false);
  return <>
    <button aria-haspopup="dialog" className="icon-text-action" onClick={() => { setDirectDate(startDate); setOpen(true); }} ref={triggerRef} type="button">
      <Copy aria-hidden="true" size={16} />복사
    </button>
    <ResponsiveDetailPanel onClose={close} open={open} panelClassName="event-copy-modal" presentation="modal" returnFocusRef={triggerRef} title="일정 복사">
      <form action={action} className="event-copy-form">
        <input name="id" type="hidden" value={eventId} />
        <p className="event-copy-form__hint">복사할 날짜를 선택하면 기존 일정 내용으로 새 일정을 만듭니다.</p>
        <div className="event-copy-menu__presets">
          <button disabled={pending} name="targetDate" type="submit" value={startDate}>같은 날짜에 복사</button>
          <button disabled={pending} name="targetDate" type="submit" value={addCalendarDays(startDate, 1)}>다음 날로 복사</button>
          <button disabled={pending} name="targetDate" type="submit" value={addCalendarDays(startDate, 7)}>다음 주 같은 요일로 복사</button>
        </div>
        <label>날짜 선택<CalendarDateInput ariaLabel="복사할 날짜 직접 선택" name="directDate" onValueChange={setDirectDate} value={directDate} /></label>
        <div className="event-copy-form__footer">
          <button className="button button--secondary" disabled={pending} name="targetDate" type="submit" value={directDate}>{pending ? "복사 중…" : "선택한 날짜로 복사"}</button>
          <button className="button button--ghost" onClick={close} type="button">취소</button>
        </div>
        {state.message && <p aria-live="polite" className={state.status === "error" ? "form-message form-message--error" : "form-message"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
      </form>
    </ResponsiveDetailPanel>
  </>;
}