import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import { formatLocalDate, parseLocalDate } from "@/lib/calendar-generator/date-utils";
import type {
  CalendarDateRule,
  CalendarExplicitDateRule,
  CalendarFixedDateRule,
  CalendarLastWeekdayRule,
  CalendarMonthListDateRule,
  CalendarNthWeekdayRule,
  CalendarRangeDateRule,
  CalendarRelativeDateRule,
  CalendarSingleDateRule,
  CalendarTemplateDefinition,
  CalendarTemplatePack,
  CalendarTemplateValidationResult,
  CalendarTemplateValidationWarning,
} from "@/lib/calendar-generator/types";

const ALWAYS_VALID_LEAP_YEAR = 2000;

export function validateCalendarTemplates(
  templates: readonly CalendarTemplateDefinition[],
): CalendarTemplateValidationResult {
  const warnings: CalendarTemplateValidationWarning[] = [];

  for (const template of templates) {
    const ruleIds = new Set<string>();
    const entries = new Set<string>();

    for (const rule of template.rules) {
      if (ruleIds.has(rule.id)) {
        warnings.push(duplicateRuleIdWarning(template.id, rule.id));
      }
      ruleIds.add(rule.id);

      const entryKey = `${rule.stickerKey}:${dateRuleKey(rule.rule)}`;
      if (entries.has(entryKey)) {
        warnings.push(duplicateEntryWarning(template.id, rule.id, rule.stickerKey));
      }
      entries.add(entryKey);

      const catalogEntry = calendarStickerByKey(rule.stickerKey);
      if (catalogEntry === undefined) {
        warnings.push(missingKeyWarning(template.id, rule.id, rule.stickerKey));
      } else if (catalogEntry.pack !== template.pack) {
        warnings.push(packMismatchWarning({
          templateId: template.id,
          ruleId: rule.id,
          stickerKey: rule.stickerKey,
          expectedPack: template.pack,
          actualPack: catalogEntry.pack,
        }));
      }

      if (!isValidDateRule(rule.rule)) {
        warnings.push(invalidDateRuleWarning(template.id, rule.id, rule.stickerKey));
      }
    }
  }

  return {
    isValid: warnings.every((warning) => warning.severity !== "error"),
    warnings,
  };
}

function missingKeyWarning(templateId: string, ruleId: string, stickerKey: string): CalendarTemplateValidationWarning {
  return {
    code: "MISSING_TEMPLATE_KEY",
    severity: "error",
    message: "Template rule references a catalog key that does not exist.",
    templateId,
    ruleId,
    stickerKey,
  };
}

type PackMismatchWarningRequest = {
  readonly templateId: string;
  readonly ruleId: string;
  readonly stickerKey: string;
  readonly expectedPack: CalendarTemplatePack;
  readonly actualPack: string;
};

function packMismatchWarning(request: PackMismatchWarningRequest): CalendarTemplateValidationWarning {
  return {
    code: "TEMPLATE_PACK_MISMATCH",
    severity: "error",
    message: "Template rule catalog pack does not match the template pack.",
    templateId: request.templateId,
    ruleId: request.ruleId,
    stickerKey: request.stickerKey,
    expectedPack: request.expectedPack,
    actualPack: request.actualPack,
  };
}

function duplicateRuleIdWarning(templateId: string, ruleId: string): CalendarTemplateValidationWarning {
  return {
    code: "DUPLICATE_TEMPLATE_RULE_ID",
    severity: "error",
    message: "Template rule id is duplicated.",
    templateId,
    ruleId,
  };
}

function duplicateEntryWarning(templateId: string, ruleId: string, stickerKey: string): CalendarTemplateValidationWarning {
  return {
    code: "DUPLICATE_TEMPLATE_ENTRY",
    severity: "error",
    message: "Template contains a duplicate sticker key and date policy entry.",
    templateId,
    ruleId,
    stickerKey,
  };
}

function invalidDateRuleWarning(templateId: string, ruleId: string, stickerKey: string): CalendarTemplateValidationWarning {
  return {
    code: "TEMPLATE_RULE_INVALID",
    severity: "error",
    message: "Template rule has an invalid date policy.",
    templateId,
    ruleId,
    stickerKey,
  };
}

function isValidDateRule(rule: CalendarDateRule): boolean {
  switch (rule.kind) {
    case "fixed":
      return isValidFixedDate(rule);
    case "nth-weekday":
      return isValidNthWeekday(rule);
    case "last-weekday":
      return isValidLastWeekday(rule);
    case "relative":
      return isValidRelativeDate(rule);
    case "explicit":
      return isValidExplicitDate(rule);
    case "range":
      return isValidRangeDate(rule);
    case "month-list":
      return isValidMonthListDate(rule);
    default:
      return assertNever(rule);
  }
}

function isValidFixedDate(rule: CalendarFixedDateRule): boolean {
  if (!isValidMonth(rule.month) || !isPositiveInteger(rule.day)) return false;

  const date = new Date(Date.UTC(ALWAYS_VALID_LEAP_YEAR, rule.month - 1, rule.day));
  return date.getUTCMonth() === rule.month - 1 && date.getUTCDate() === rule.day;
}

function isValidNthWeekday(rule: CalendarNthWeekdayRule): boolean {
  return isValidMonth(rule.month)
    && isValidWeekday(rule.weekday)
    && isPositiveInteger(rule.occurrence)
    && rule.occurrence >= 1
    && rule.occurrence <= 5;
}

function isValidLastWeekday(rule: CalendarLastWeekdayRule): boolean {
  return isValidMonth(rule.month) && isValidWeekday(rule.weekday);
}

function isValidRelativeDate(rule: CalendarRelativeDateRule): boolean {
  return rule.anchorRuleId.trim().length > 0 && Number.isInteger(rule.offsetDays);
}

function isValidExplicitDate(rule: CalendarExplicitDateRule): boolean {
  const parsed = parseLocalDate(rule.date);
  return parsed !== null && formatLocalDate(parsed) === rule.date;
}

function isValidRangeDate(rule: CalendarRangeDateRule): boolean {
  const startDate = comparableDate(rule.start);
  const endDate = comparableDate(rule.end);
  return startDate !== null && endDate !== null && startDate <= endDate;
}

function isValidMonthListDate(rule: CalendarMonthListDateRule): boolean {
  const uniqueMonths = new Set(rule.months);
  return rule.months.length > 0
    && uniqueMonths.size === rule.months.length
    && rule.months.every((month) => isValidMonth(month) && isPositiveInteger(rule.day) && rule.day <= daysInMonth(ALWAYS_VALID_LEAP_YEAR, month))
    && !rule.months.some((month) => month === 2 && rule.day === 29);
}

function comparableDate(rule: CalendarSingleDateRule): string | null {
  switch (rule.kind) {
    case "fixed":
      if (!isValidFixedDate(rule)) return null;
      return formatLocalDate({ year: ALWAYS_VALID_LEAP_YEAR, month: rule.month, day: rule.day });
    case "explicit":
      return isValidExplicitDate(rule) ? rule.date : null;
    case "nth-weekday":
      return null;
    case "last-weekday":
      return null;
    case "relative":
      return null;
    default:
      return assertNever(rule);
  }
}

function isValidMonth(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

function isValidWeekday(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dateRuleKey(rule: CalendarDateRule): string {
  switch (rule.kind) {
    case "fixed":
      return `fixed:${rule.month}:${rule.day}`;
    case "nth-weekday":
      return `nth:${rule.month}:${rule.weekday}:${rule.occurrence}`;
    case "last-weekday":
      return `last:${rule.month}:${rule.weekday}`;
    case "relative":
      return `relative:${rule.anchorRuleId}:${rule.offsetDays}`;
    case "explicit":
      return `explicit:${rule.date}`;
    case "range":
      return `range:${dateRuleKey(rule.start)}:${dateRuleKey(rule.end)}`;
    case "month-list":
      return `month-list:${rule.months.join(",")}:${rule.day}`;
    default:
      return assertNever(rule);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled calendar date rule ${JSON.stringify(value)}`);
}
