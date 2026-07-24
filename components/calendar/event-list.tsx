import { ArrowRight, Bell, Copy, ExternalLink, Pencil, Save, Trash2 } from "lucide-react";
import Link from "next/link";

import { deleteWorkItemAction, duplicateWorkItemAction, saveWorkItemAsTemplateAction } from "@/app/(app)/work-item-actions";
import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { CreateItemForm } from "@/components/layout/create-item-form";
import type { WorkflowData } from "@/lib/work-items/phase5-repository";
import type { EventRow } from "@/types/database";
import type { ExerciseLogRow } from "@/types/database";
import {
  EVENT_TYPE_LABELS,
  TOURNAMENT_APPLICATION_LABELS,
  eventDetailsForType,
  resolveEventType,
} from "@/lib/work-items/event-types";

const recurrenceLabel = { daily: "매일", weekly: "매주", monthly: "매월", yearly: "매년" } as const;

interface EventListProps {
  readonly currentTime?: string;
  readonly date: string;
  readonly events: readonly EventRow[];
  readonly exerciseLogs?: readonly ExerciseLogRow[];
  readonly today?: string;
  readonly workflow: WorkflowData;
}

function eventHasEnded(event: EventRow, today: string, currentTime: string): boolean {
  if (event.end_date < today) return true;
  if (event.end_date > today || event.is_all_day) return false;
  const effectiveEnd = event.end_time?.slice(0, 5) ?? event.start_time?.slice(0, 5);
  return Boolean(effectiveEnd && effectiveEnd <= currentTime);
}

function exerciseHref(event: EventRow, linkedLog?: ExerciseLogRow): string {
  const date = linkedLog?.exercise_date ?? event.start_date;
  const params = new URLSearchParams({ date, month: date.slice(0, 7) });
  if (linkedLog) {
    params.set("logId", linkedLog.id);
  } else {
    params.set("create", "sticker");
    params.set("eventId", event.id);
    params.set("recordType", resolveEventType(event) === "tournament" ? "competition" : "exercise");
  }
  return `/exercise?${params.toString()}`;
}

export function EventList({
  currentTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", minute: "2-digit", timeZone: "Asia/Seoul" }).format(new Date()),
  date,
  events,
  exerciseLogs = [],
  today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date()),
  workflow,
}: EventListProps) {
  if (!events.length) return <section aria-label={`${date} 일정 상세`} className="calendar-list"><p className="static-note">선택한 날짜에 등록된 일정이 없습니다.</p></section>;
  return <section className="calendar-list" aria-label={`${date} 일정 상세`}>{events.map((event) => {
    const links = workflow.eventLinks.filter((item) => item.event_id === event.id);
    const reminders = workflow.eventReminders.filter((item) => item.event_id === event.id);
    const eventType = resolveEventType(event);
    const details = eventDetailsForType(event, eventType);
    const recordable = eventType === "workout" || eventType === "tournament";
    const linkedLog = exerciseLogs.find((log) => log.event_id === event.id);
    const showRecordLink = recordable && (linkedLog !== undefined || eventHasEnded(event, today, currentTime));
    const startTime = event.start_time?.slice(0, 5);
    const endTime = event.end_time?.slice(0, 5);
    const timeLabel = event.is_all_day || !startTime ? "종일" : endTime ? `${startTime} ~ ${endTime}` : startTime;
    return <article className="calendar-list__item" key={event.id}>
      <div>
        <time>{event.start_date} · {timeLabel}</time>
        <strong>{event.title}</strong>
        <span className={`event-area-badge event-area-badge--${eventType}`}>{EVENT_TYPE_LABELS[eventType]}</span>
        {event.location && <small>장소 · {event.location}</small>}
        {details?.kind === "workout" && details.workoutType && <small>운동 · {details.workoutType}</small>}
        {details?.kind === "tournament" && <>
          {details.tournamentName && details.tournamentName !== event.title && <small>대회명 · {details.tournamentName}</small>}
          {details.discipline && <small>종목 · {details.discipline}</small>}
          {(details.partner || details.level) && <small>{details.partner ? `파트너 · ${details.partner}` : ""}{details.partner && details.level ? " · " : ""}{details.level ? `급수 · ${details.level}` : ""}</small>}
          <small>신청 · {TOURNAMENT_APPLICATION_LABELS[details.applicationStatus]}</small>
        </>}
        {event.recurrence_frequency && <small>반복 · {recurrenceLabel[event.recurrence_frequency]}</small>}
        {links.map((link) => <a className="event-link" href={link.url} key={link.id} rel="noreferrer" target="_blank"><ExternalLink size={12} />{link.title}</a>)}
        {reminders.length > 0 && <small><Bell size={12} /> 알림 {reminders.length}</small>}
        {showRecordLink && <Link className="tournament-record-link" href={exerciseHref(event, linkedLog)}>{linkedLog ? (eventType === "tournament" ? "대회 기록 보기" : "운동 기록 보기") : (eventType === "tournament" ? "결과 기록하기" : "운동 기록 작성")}<ArrowRight aria-hidden="true" size={14} /></Link>}
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
