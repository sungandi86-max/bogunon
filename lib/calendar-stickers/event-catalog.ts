import type { TemplateDefinition } from "@/lib/work-items/workflow";
import type { CalendarStickerDefinition } from "@/lib/calendar-stickers/catalog";

export const CALENDAR_EVENT_STICKER_PACKS = ["workout", "tournament"] as const;
export type CalendarEventStickerPack = (typeof CALENDAR_EVENT_STICKER_PACKS)[number];

export const CALENDAR_WORKOUT_STICKERS = [
  { key: "badminton", label: "배드민턴", iconKey: "badminton" },
  { key: "pilates", label: "필라테스", iconKey: "stretch" },
  { key: "fitness", label: "헬스", iconKey: "strength" },
  { key: "running", label: "러닝", iconKey: "running" },
  { key: "walking", label: "걷기", iconKey: "walking" },
  { key: "cycling", label: "자전거", iconKey: "cycling" },
  { key: "swimming", label: "수영", iconKey: "swimming" },
  { key: "yoga", label: "요가", iconKey: "stretch" },
  { key: "hiking", label: "등산", iconKey: "hiking" },
  { key: "other", label: "기타 운동", iconKey: "other" },
] as const;

export type CalendarWorkoutSticker = (typeof CALENDAR_WORKOUT_STICKERS)[number];
export type CalendarWorkoutIconKey = CalendarWorkoutSticker["iconKey"];

function eventTemplate(date: string): TemplateDefinition {
  return {
    key: `calendar-event-${date}`,
    name: "캘린더 일정",
    kind: "event",
    area: "exercise",
    category: "event",
    title: "",
    description: "",
    priority: "normal",
    estimatedMinutes: 30,
    recommendedTiming: "선택한 날짜",
    recurrenceFrequency: null,
    checklist: [],
    memo: "",
    startDate: date,
    endDate: date,
    isAllDay: true,
  };
}

export function workoutEventTemplate(
  sticker: CalendarWorkoutSticker,
  date: string,
): TemplateDefinition {
  return {
    ...eventTemplate(date),
    key: `calendar-workout-${sticker.key}-${date}`,
    name: `${sticker.label} 일정`,
    title: sticker.label,
    eventType: "workout",
    workoutType: sticker.label,
    colorKey: "mint",
  };
}

export function tournamentEventTemplate(date: string): TemplateDefinition {
  return {
    ...eventTemplate(date),
    key: `calendar-tournament-${date}`,
    name: "대회 일정",
    eventType: "tournament",
    applicationStatus: "planned",
    colorKey: "coral",
  };
}

const stickerEventDefaults = {
  personal: { area: "personal", eventType: "personal", colorKey: "pink" },
  health: { area: "healthWork", eventType: "work", colorKey: "mint" },
  holiday: { area: "schoolSchedule", eventType: "school", colorKey: "yellow" },
  school: { area: "schoolSchedule", eventType: "school", colorKey: "blue" },
  academic: { area: "schoolSchedule", eventType: "school", colorKey: "blue" },
} as const;

export function dateStickerEventTemplate(
  sticker: CalendarStickerDefinition,
  startDate: string,
  endDate = startDate,
): TemplateDefinition {
  const defaults = stickerEventDefaults[sticker.pack];
  return {
    ...eventTemplate(startDate),
    key: `calendar-sticker-${sticker.key}-${startDate}`,
    name: `${sticker.label} 일정`,
    title: sticker.label,
    description: "",
    area: defaults.area,
    eventType: defaults.eventType,
    colorKey: sticker.key === "academic.club" ? "lavender" : defaults.colorKey,
    startDate,
    endDate,
    stickerKey: sticker.key,
  };
}
