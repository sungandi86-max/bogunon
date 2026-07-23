import type {
  CalendarGeneratorWarning,
  CalendarRuleOverride,
  CalendarStickerCandidate,
  CalendarTemplateDefinition,
  CalendarTemplateRuleMetadata,
  VariableHolidayEntry,
} from "@/lib/calendar-generator/types";

export type VariableHolidayInput = Omit<VariableHolidayEntry, "pack"> & {
  readonly pack: string;
};

export type TemplateResolverWarningCode =
  | CalendarGeneratorWarning["code"]
  | "DUPLICATE_TEMPLATE_CANDIDATE"
  | "INVALID_OVERRIDE"
  | "INVALID_VARIABLE_HOLIDAY"
  | "RELATIVE_ANCHOR_DISABLED";

export type TemplateResolverWarning = Omit<CalendarGeneratorWarning, "code"> & {
  readonly code: TemplateResolverWarningCode;
  readonly stickerKey?: string;
  readonly omittedKeys?: readonly string[];
};

export type ResolvedCalendarStickerCandidate = CalendarStickerCandidate & {
  readonly sourceRuleId: string;
  readonly metadata?: CalendarTemplateRuleMetadata;
};

export type ResolveCalendarTemplatesRequest = {
  readonly year: number;
  readonly templates: readonly CalendarTemplateDefinition[];
  readonly overrides?: readonly CalendarRuleOverride[];
  readonly variableHolidays?: readonly VariableHolidayInput[];
};

export type ResolveCalendarTemplatesResult = {
  readonly year: number;
  readonly candidates: readonly ResolvedCalendarStickerCandidate[];
  readonly warnings: readonly TemplateResolverWarning[];
};
