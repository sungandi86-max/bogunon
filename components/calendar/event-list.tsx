import { Bell, Copy, ExternalLink, Pencil, Save, Trash2 } from "lucide-react";

import { deleteWorkItemAction, duplicateWorkItemAction, saveWorkItemAsTemplateAction } from "@/app/(app)/work-item-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { CreateItemForm } from "@/components/layout/create-item-form";
import type { WorkflowData } from "@/lib/work-items/phase5-repository";
import type { EventRow } from "@/types/database";

const areaLabel = { healthWork: "업무", schoolSchedule: "학교", personal: "개인", exercise: "운동", project: "프로젝트" } as const;
const recurrenceLabel = { daily: "매일", weekly: "매주", monthly: "매월", yearly: "매년" } as const;

export function EventList({ events, workflow }: { readonly events: EventRow[]; readonly workflow: WorkflowData }) {
  if (!events.length) return <p className="static-note">이 달에 등록된 일정이 없습니다.</p>;
  return <section className="calendar-list" aria-label="월간 일정 목록">{events.map((event) => {
    const links = workflow.eventLinks.filter((item) => item.event_id === event.id);
    const reminders = workflow.eventReminders.filter((item) => item.event_id === event.id);
    return <article className="calendar-list__item" key={event.id}>
      <div>
        <time>{event.start_date}{event.start_time ? ` ${event.start_time.slice(0, 5)}` : ""}</time>
        <strong>{event.title}</strong>
        <span className={`event-area-badge event-area-badge--${event.area}`}>{areaLabel[event.area]}</span>
        {event.location && <small>장소 · {event.location}</small>}
        {event.recurrence_frequency && <small>반복 · {recurrenceLabel[event.recurrence_frequency]}</small>}
        {links.map((link) => <a className="event-link" href={link.url} key={link.id} rel="noreferrer" target="_blank"><ExternalLink size={12} />{link.title}</a>)}
        {reminders.length > 0 && <small><Bell size={12} /> 알림 {reminders.length}</small>}
      </div>
      <div className="work-item-actions">
        <details><summary><Pencil aria-hidden="true" size={16} />편집</summary><div className="inline-editor"><CreateItemForm initialItem={event} links={links} reminders={reminders} /></div></details>
        <details><summary><Copy size={16} />복제</summary><form action={duplicateWorkItemAction} className="duplicate-menu"><input name="id" type="hidden" value={event.id} /><input name="kind" type="hidden" value="event" /><label>새 날짜<CalendarDateInput name="date" /></label><label><input defaultChecked name="includeDescription" type="checkbox" />설명</label><label><input defaultChecked name="includeMemo" type="checkbox" />메모</label><button className="button button--primary" type="submit">새 일정으로 복제</button></form></details>
        <form action={saveWorkItemAsTemplateAction}><input name="id" type="hidden" value={event.id} /><input name="kind" type="hidden" value="event" /><button className="icon-text-action" title="템플릿으로 저장" type="submit"><Save size={16} />템플릿</button></form>
        <form action={deleteWorkItemAction}><input name="id" type="hidden" value={event.id} /><input name="kind" type="hidden" value="event" /><button className="danger-action" type="submit"><Trash2 aria-hidden="true" size={16} />삭제</button></form>
      </div>
    </article>;
  })}</section>;
}
