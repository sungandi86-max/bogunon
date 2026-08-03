import { CALENDAR_EVENT_STICKER_PACKS, type CalendarEventStickerPack } from "@/lib/calendar-stickers/event-catalog";
import {
  ACADEMIC_CALENDAR_STICKERS,
  HEALTH_CALENDAR_STICKERS,
  HOLIDAY_CALENDAR_STICKERS,
  PERSONAL_CALENDAR_STICKERS,
  SCHOOL_CALENDAR_STICKERS,
  type CalendarStickerGroup,
  type CalendarStickerPack,
} from "@/lib/calendar-stickers/catalog";

export type DateStickerPack = Exclude<CalendarStickerPack, "academic"> | CalendarEventStickerPack;

export const DATE_STICKER_PACKS = [
  ["school", "학교"],
  ["health", "보건업무"],
  ["holiday", "공휴일"],
  ["personal", "개인"],
  ["workout", "운동"],
  ["tournament", "대회"],
] as const satisfies readonly (readonly [DateStickerPack, string])[];

const schoolGroups = [
  ["all", "전체"],
  ["school", "학교생활"],
  ["semester", "학기"],
  ["exam", "시험"],
  ["event", "행사"],
  ["operation", "운영"],
] as const satisfies readonly (readonly [CalendarStickerGroup | "all", string])[];
const academicGroups = [
  ["all", "전체"],
  ["semester", "학기"],
  ["exam", "시험"],
  ["event", "행사"],
  ["operation", "운영"],
] as const satisfies readonly (readonly [CalendarStickerGroup | "all", string])[];
const healthGroups = [
  ["all", "전체"],
  ["screening", "건강검사"],
  ["education", "보건교육"],
  ["operation", "운영·점검"],
  ["administration", "행정·협업"],
] as const satisfies readonly (readonly [CalendarStickerGroup | "all", string])[];
const holidayGroups = [
  ["all", "전체"],
  ["national", "국가 공휴일"],
  ["traditional", "명절"],
  ["special", "대체·특별 휴일"],
  ["general", "일반 휴일"],
] as const satisfies readonly (readonly [CalendarStickerGroup | "all", string])[];

export function catalogForPack(pack: CalendarStickerPack) {
  if (pack === "academic") return ACADEMIC_CALENDAR_STICKERS;
  if (pack === "school") return [...SCHOOL_CALENDAR_STICKERS, ...ACADEMIC_CALENDAR_STICKERS];
  if (pack === "health") return HEALTH_CALENDAR_STICKERS;
  if (pack === "holiday") return HOLIDAY_CALENDAR_STICKERS;
  if (pack === "personal") return PERSONAL_CALENDAR_STICKERS;
  return SCHOOL_CALENDAR_STICKERS;
}

export function isCalendarEventStickerPack(pack: DateStickerPack): pack is CalendarEventStickerPack {
  return CALENDAR_EVENT_STICKER_PACKS.some((value) => value === pack);
}

export function groupsForPack(pack: CalendarStickerPack) {
  if (pack === "school") return schoolGroups;
  if (pack === "academic") return academicGroups;
  if (pack === "health") return healthGroups;
  if (pack === "holiday") return holidayGroups;
  return [];
}
