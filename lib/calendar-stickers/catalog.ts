export const CALENDAR_STICKER_CATALOG = [
  { key: "vacation-ceremony", label: "방학식", assetPath: "/stickers/school-calendar/vacation-ceremony.svg" },
  { key: "opening-ceremony", label: "개학식", assetPath: "/stickers/school-calendar/opening-ceremony.svg" },
  { key: "holiday", label: "공휴일", assetPath: "/stickers/school-calendar/holiday.svg" },
  { key: "long-weekend", label: "연휴", assetPath: "/stickers/school-calendar/long-weekend.svg" },
  { key: "school-closure", label: "재량휴업일", assetPath: "/stickers/school-calendar/school-closure.svg" },
  { key: "exam-period", label: "시험기간", assetPath: "/stickers/school-calendar/exam-period.svg" },
  { key: "school-event", label: "학교행사", assetPath: "/stickers/school-calendar/school-event.svg" },
  { key: "staff-training", label: "교직원 연수", assetPath: "/stickers/school-calendar/staff-training.svg" },
  { key: "flexible-curriculum", label: "수업량 유연화", assetPath: "/stickers/school-calendar/flexible-curriculum.svg" },
  { key: "other", label: "기타", assetPath: "/stickers/school-calendar/other.svg" },
] as const;

export type CalendarStickerKey = (typeof CALENDAR_STICKER_CATALOG)[number]["key"];
export type CalendarStickerDefinition = (typeof CALENDAR_STICKER_CATALOG)[number];

export function calendarStickerByKey(key: string): CalendarStickerDefinition | undefined {
  return CALENDAR_STICKER_CATALOG.find((sticker) => sticker.key === key);
}
