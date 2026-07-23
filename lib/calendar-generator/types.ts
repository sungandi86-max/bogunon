export type CalendarTemplatePack = "holiday" | "academic" | "health";

export type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type WeekdayOccurrence = 1 | 2 | 3 | 4 | 5;
export type CalendarDateRuleKind =
  | "fixed"
  | "nth-weekday"
  | "last-weekday"
  | "relative"
  | "explicit"
  | "range"
  | "month-list";

export type CalendarDateParts = {
  readonly year: number;
  readonly month: MonthNumber;
  readonly day: number;
};

export type CalendarFixedDateRule = {
  readonly kind: "fixed";
  readonly month: MonthNumber;
  readonly day: number;
};

export type CalendarNthWeekdayRule = {
  readonly kind: "nth-weekday";
  readonly month: MonthNumber;
  readonly weekday: Weekday;
  readonly occurrence: WeekdayOccurrence;
};

export type CalendarLastWeekdayRule = {
  readonly kind: "last-weekday";
  readonly month: MonthNumber;
  readonly weekday: Weekday;
};

export type CalendarRelativeDateRule = {
  readonly kind: "relative";
  readonly anchorRuleId: string;
  readonly offsetDays: number;
};

export type CalendarExplicitDateRule = {
  readonly kind: "explicit";
  readonly date: string;
};

export type CalendarSingleDateRule =
  | CalendarFixedDateRule
  | CalendarNthWeekdayRule
  | CalendarLastWeekdayRule
  | CalendarRelativeDateRule
  | CalendarExplicitDateRule;

export type CalendarRangeDateRule = {
  readonly kind: "range";
  readonly start: CalendarSingleDateRule;
  readonly end: CalendarSingleDateRule;
};

export type CalendarMonthListDateRule = {
  readonly kind: "month-list";
  readonly months: readonly MonthNumber[];
  readonly day: number;
};

export type CalendarDateRule = CalendarSingleDateRule | CalendarRangeDateRule | CalendarMonthListDateRule;

export type CalendarRuleOverride = {
  readonly ruleId: string;
  readonly enabled?: boolean;
  readonly date?: string;
  readonly startDate?: string;
  readonly endDate?: string | null;
};

export type VariableHolidayEntry = {
  readonly ruleId: string;
  readonly stickerKey: string;
  readonly pack: "holiday";
  readonly sourceYear: number;
  readonly year: number;
  readonly date: string;
  readonly label?: string;
};

export type ExistingCalendarStickerIdentity = {
  readonly stickerDate: string;
  readonly stickerKey: string;
};

export type CalendarTemplateRule = {
  readonly id: string;
  readonly stickerKey: string;
  readonly rule: CalendarDateRule;
  readonly note?: string | null;
  readonly requiresConfirmation: boolean;
  readonly metadata?: CalendarTemplateRuleMetadata;
};

export type CalendarTemplateRuleMetadata = {
  readonly schoolAdjustment?: {
    readonly suggestedRule: string;
    readonly confirmationReason: string;
  };
};

export type CalendarTemplateDefinition = {
  readonly id: string;
  readonly version: string;
  readonly pack: CalendarTemplatePack;
  readonly rules: readonly CalendarTemplateRule[];
};

export type CalendarTemplateValidationWarningCode =
  | "MISSING_TEMPLATE_KEY"
  | "TEMPLATE_PACK_MISMATCH"
  | "DUPLICATE_TEMPLATE_RULE_ID"
  | "DUPLICATE_TEMPLATE_ENTRY"
  | "TEMPLATE_RULE_INVALID";

export type CalendarTemplateValidationWarning = {
  readonly code: CalendarTemplateValidationWarningCode;
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly templateId: string;
  readonly ruleId?: string;
  readonly stickerKey?: string;
  readonly expectedPack?: CalendarTemplatePack;
  readonly actualPack?: string;
};

export type CalendarTemplateValidationResult = {
  readonly isValid: boolean;
  readonly warnings: readonly CalendarTemplateValidationWarning[];
};

export type CalendarGeneratorWarningCode =
  | "INVALID_DATE"
  | "INVALID_YEAR"
  | "MISSING_ANCHOR"
  | "RELATIVE_ANCHOR_CYCLE"
  | "RANGE_OUT_OF_YEAR"
  | "VARIABLE_HOLIDAY_DATASET_MISSING"
  | "DUPLICATE_DATASET_ENTRY"
  | "DUPLICATE_TEMPLATE_IDENTITY"
  | "EXISTING_STICKER_COLLISION"
  | "CONFIRMATION_REQUIRED"
  | "STALE_GENERATED_STATE";

export type CalendarGeneratorWarning = {
  readonly code: CalendarGeneratorWarningCode;
  readonly severity: "info" | "warning" | "error";
  readonly message: string;
  readonly ruleId?: string;
  readonly date?: string;
};

export type CalendarStickerCandidate = {
  readonly ruleId: string;
  readonly stickerKey: string;
  readonly pack: CalendarTemplatePack;
  readonly label: string;
  readonly stickerDate: string;
  readonly endDate: string | null;
  readonly note: string | null;
  readonly requiresConfirmation: boolean;
  readonly templateId: string;
  readonly templateVersion: string;
  readonly sortOrder: number;
};

export type CalendarGeneratorRequest = {
  readonly year: number;
  readonly selectedPacks: readonly CalendarTemplatePack[];
  readonly overrides: readonly CalendarRuleOverride[];
  readonly variableHolidays: readonly VariableHolidayEntry[];
  readonly confirmedRuleIds: readonly string[];
  readonly existingIdentities: readonly ExistingCalendarStickerIdentity[];
  readonly mode: "create-missing" | "replace-pack-range";
};

export type CalendarPreviewItem = CalendarStickerCandidate & {
  readonly status: "creatable" | "skipped-existing" | "needs-confirmation";
};

export type CalendarPreview = {
  readonly year: number;
  readonly items: readonly CalendarPreviewItem[];
  readonly totalCount: number;
  readonly creatableCount: number;
  readonly skippedCount: number;
  readonly confirmationCount: number;
  readonly byPack: Readonly<Record<CalendarTemplatePack, number>>;
  readonly warnings: readonly CalendarGeneratorWarning[];
};

export type CalendarGenerationPlan = {
  readonly request: CalendarGeneratorRequest;
  readonly preview: CalendarPreview;
  readonly canGenerate: boolean;
  readonly warnings: readonly CalendarGeneratorWarning[];
};

export type CalendarStickerInsertPayload = {
  readonly sticker_key: string;
  readonly sticker_date: string;
  readonly end_date: string | null;
  readonly label: string;
  readonly note: string | null;
};
