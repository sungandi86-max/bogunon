import type { EventRow, PracticalScheduleCategory } from "@/types/database";
import { calendarStickerByKey, type CalendarStickerKey } from "@/lib/calendar-stickers/catalog";

export const practicalScheduleCategoryLabels: Record<PracticalScheduleCategory, string> = {
  staff: "교직원",
  student: "학생",
  admin: "행정",
};

export function isSafePracticalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function formatPracticalScheduleDate(value: string | null): string {
  return value ? value.replaceAll("-", ".") : "날짜 미정";
}

export function practicalScheduleCalendarDescription(method: string | null, notes: string | null): string | null {
  const description = [method, notes].filter((item): item is string => Boolean(item)).join("\n");
  return description || null;
}

export function isLinkablePracticalEvent(event: EventRow): boolean {
  const importedSchoolEvent = event.area === "schoolSchedule" && event.color_key === "yellow";
  return (event.practical_schedule_id === null || event.practical_schedule_id === undefined)
    && (event.recurrence_frequency === null || event.recurrence_frequency === undefined)
    && (event.recurrence_source_id === null || event.recurrence_source_id === undefined)
    && !importedSchoolEvent
    && event.event_type !== "workout"
    && event.event_type !== "tournament";
}

export function parsePracticalStickerKey(value: string | null): CalendarStickerKey | null {
  if (!value) return null;
  return calendarStickerByKey(value)?.key ?? null;
}
