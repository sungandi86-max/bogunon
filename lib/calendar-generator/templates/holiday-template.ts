import type { CalendarTemplateDefinition, CalendarTemplateRule } from "@/lib/calendar-generator/types";

export const FIXED_HOLIDAY_RULES = [
  { id: "holiday-new-year", stickerKey: "holiday.new-year", rule: { kind: "fixed", month: 1, day: 1 }, requiresConfirmation: false },
  { id: "holiday-march-first", stickerKey: "holiday.march-first", rule: { kind: "fixed", month: 3, day: 1 }, requiresConfirmation: false },
  { id: "holiday-labor-day", stickerKey: "holiday.labor-day", rule: { kind: "fixed", month: 5, day: 1 }, requiresConfirmation: false },
  { id: "holiday-childrens-day", stickerKey: "holiday.childrens-day", rule: { kind: "fixed", month: 5, day: 5 }, requiresConfirmation: false },
  { id: "holiday-memorial-day", stickerKey: "holiday.memorial-day", rule: { kind: "fixed", month: 6, day: 6 }, requiresConfirmation: false },
  { id: "holiday-constitution-day", stickerKey: "holiday.constitution-day", rule: { kind: "fixed", month: 7, day: 17 }, requiresConfirmation: false },
  { id: "holiday-liberation-day", stickerKey: "holiday.liberation-day", rule: { kind: "fixed", month: 8, day: 15 }, requiresConfirmation: false },
  { id: "holiday-national-foundation-day", stickerKey: "holiday.national-foundation-day", rule: { kind: "fixed", month: 10, day: 3 }, requiresConfirmation: false },
  { id: "holiday-hangul-day", stickerKey: "holiday.hangul-day", rule: { kind: "fixed", month: 10, day: 9 }, requiresConfirmation: false },
  { id: "holiday-christmas", stickerKey: "holiday.christmas", rule: { kind: "fixed", month: 12, day: 25 }, requiresConfirmation: false },
] as const satisfies readonly CalendarTemplateRule[];

export const VARIABLE_HOLIDAY_KEYS = [
  "holiday.seollal",
  "holiday.seollal-break",
  "holiday.buddhas-birthday",
  "holiday.chuseok",
  "holiday.chuseok-break",
  "holiday.substitute",
  "holiday.temporary",
  "holiday.election-day",
] as const;

export const HOLIDAY_TEMPLATE = {
  id: "holiday-v1",
  version: "1.0.0",
  pack: "holiday",
  rules: FIXED_HOLIDAY_RULES,
} as const satisfies CalendarTemplateDefinition;
