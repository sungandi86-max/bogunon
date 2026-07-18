export const SCHOOL_CALENDAR_STICKERS = [
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

export const PERSONAL_CALENDAR_STICKERS = [
  { key: "personal.hospital", label: "병원", assetPath: "/stickers/personal-calendar/hospital.svg" },
  { key: "personal.hair-salon", label: "미용실", assetPath: "/stickers/personal-calendar/hair-salon.svg" },
  { key: "personal.appointment", label: "약속", assetPath: "/stickers/personal-calendar/appointment.svg" },
  { key: "personal.travel", label: "여행", assetPath: "/stickers/personal-calendar/travel.svg" },
  { key: "personal.date", label: "데이트", assetPath: "/stickers/personal-calendar/date.svg" },
  { key: "personal.family", label: "가족 일정", assetPath: "/stickers/personal-calendar/family.svg" },
  { key: "personal.birthday", label: "생일", assetPath: "/stickers/personal-calendar/birthday.svg" },
  { key: "personal.grocery", label: "장보기", assetPath: "/stickers/personal-calendar/grocery.svg" },
  { key: "personal.dining", label: "외식", assetPath: "/stickers/personal-calendar/dining.svg" },
  { key: "personal.culture", label: "공연·전시", assetPath: "/stickers/personal-calendar/culture.svg" },
  { key: "personal.workout-meetup", label: "운동 약속", assetPath: "/stickers/personal-calendar/workout-meetup.svg" },
  { key: "personal.other", label: "기타", assetPath: "/stickers/personal-calendar/other.svg" },
] as const;

export const CALENDAR_STICKER_CATALOG = [...SCHOOL_CALENDAR_STICKERS, ...PERSONAL_CALENDAR_STICKERS] as const;

export type CalendarStickerKey = (typeof CALENDAR_STICKER_CATALOG)[number]["key"];
export type CalendarStickerDefinition = (typeof CALENDAR_STICKER_CATALOG)[number];
export type CalendarStickerCategory = "school" | "personal";

export function calendarStickerCategory(key: string): CalendarStickerCategory {
  return key.startsWith("personal.") ? "personal" : "school";
}

export function calendarStickerByKey(key: string): CalendarStickerDefinition | undefined {
  return CALENDAR_STICKER_CATALOG.find((sticker) => sticker.key === key);
}
