import type { Area } from "@/types/database";
import type { CalendarTemplatePack } from "@/lib/calendar-generator/types";

export const SMART_CALENDAR_SEMESTERS = ["all", "first", "second"] as const;
export type SmartCalendarSemester = (typeof SMART_CALENDAR_SEMESTERS)[number];

export const SMART_CALENDAR_DUPLICATE_DECISIONS = ["unchecked", "skip", "force"] as const;
export type SmartCalendarDuplicateDecision = (typeof SMART_CALENDAR_DUPLICATE_DECISIONS)[number];

export type SmartCalendarExistingEvent = {
  readonly id: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
};

export type SmartCalendarDuplicate = {
  readonly eventId: string;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
};

export type SmartCalendarPreviewItem = {
  readonly clientId: string;
  readonly ruleId: string;
  readonly pack: CalendarTemplatePack;
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly area: Extract<Area, "schoolSchedule" | "healthWork">;
  readonly allDay: true;
  readonly description: string;
  readonly categoryLabel: string;
  readonly warning: "ready" | "needs-confirmation" | "date-error" | "duplicate";
  readonly selected: boolean;
  readonly duplicateDecision: SmartCalendarDuplicateDecision;
  readonly duplicate?: SmartCalendarDuplicate;
};

export type SmartCalendarPreview = {
  readonly year: number;
  readonly semester: SmartCalendarSemester;
  readonly items: readonly SmartCalendarPreviewItem[];
  readonly warnings: readonly string[];
};

export type BuildSmartCalendarPreviewRequest = {
  readonly year: number;
  readonly semester: SmartCalendarSemester;
  readonly selectedPacks: readonly CalendarTemplatePack[];
  readonly existingEvents: readonly SmartCalendarExistingEvent[];
};
