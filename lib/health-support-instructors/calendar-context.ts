import type { EventRow } from "@/types/database";

export type HealthSupportTimeDraft = {
  readonly startTime: string;
  readonly endTime: string;
};

export function calendarEventsForWorkDate(events: readonly EventRow[], selectedDate: string): readonly EventRow[] {
  const seenIds = new Set<string>();
  return events.filter((event) => {
    const isRelevantSchoolEvent = event.area === "schoolSchedule";
    const overlapsWorkDate = event.start_date <= selectedDate && event.end_date >= selectedDate;
    if (!isRelevantSchoolEvent || !overlapsWorkDate || seenIds.has(event.id)) return false;
    seenIds.add(event.id);
    return true;
  });
}

export function appendCalendarContextToDraft(note: string, event: Pick<EventRow, "title">): string {
  const context = `[일정 참고] ${event.title}`;
  if (note.includes(context)) return note;
  return note ? `${note}\n${context}` : context;
}

export function timeDraftFromWorkLog(log: { readonly startTime: string; readonly endTime: string }): HealthSupportTimeDraft {
  return { startTime: log.startTime.slice(0, 5), endTime: log.endTime.slice(0, 5) };
}
