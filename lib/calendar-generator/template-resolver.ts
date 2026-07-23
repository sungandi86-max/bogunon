import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import { formatLocalDate, lastWeekdayOfMonth, nthWeekdayOfMonth, parseLocalDate } from "@/lib/calendar-generator/date-utils";
import { normalizeOverrides } from "@/lib/calendar-generator/template-override-normalization";
import type { NormalizedCalendarRuleOverride } from "@/lib/calendar-generator/template-override-normalization";
import { VARIABLE_HOLIDAY_KEYS } from "@/lib/calendar-generator/templates/holiday-template";
import { addDays, dedupeAndSort, invalidDate, isSupportedYear, readInYear, warning } from "@/lib/calendar-generator/template-resolver-support";
import type { RuleResolution } from "@/lib/calendar-generator/template-resolver-support";
import type { ResolvedCalendarStickerCandidate, ResolveCalendarTemplatesRequest, ResolveCalendarTemplatesResult, TemplateResolverWarning } from "@/lib/calendar-generator/template-resolver-types";
export type { ResolvedCalendarStickerCandidate, ResolveCalendarTemplatesRequest, ResolveCalendarTemplatesResult, TemplateResolverWarning, TemplateResolverWarningCode, VariableHolidayInput } from "@/lib/calendar-generator/template-resolver-types";
import type { CalendarDateRule, CalendarSingleDateRule, CalendarTemplateDefinition, CalendarTemplateRule } from "@/lib/calendar-generator/types";

type RuleContext = {
  readonly template: CalendarTemplateDefinition;
  readonly rule: CalendarTemplateRule;
};

export function resolveCalendarTemplates(request: ResolveCalendarTemplatesRequest): ResolveCalendarTemplatesResult {
  const warnings: TemplateResolverWarning[] = [];
  if (!isSupportedYear(request.year)) {
    return { year: request.year, candidates: [], warnings: [warning("INVALID_YEAR", "error", `Unsupported calendar year ${request.year}.`)] };
  }

  const rulesById = new Map<string, RuleContext>();
  for (const template of request.templates) {
    for (const rule of template.rules) {
      if (!rulesById.has(rule.id)) rulesById.set(rule.id, { template, rule });
    }
  }

  const overrides = normalizeOverrides(request.overrides ?? [], rulesById, warnings);
  const candidates: ResolvedCalendarStickerCandidate[] = [];
  const warnedCycles = new Set<string>();
  for (const template of request.templates) {
    for (const rule of template.rules) {
      candidates.push(...resolveTemplateRule({ year: request.year, template, rule, rulesById, overrides, warnedCycles, warnings, resolving: [] }));
    }
  }

  if (request.templates.some((template) => template.pack === "holiday")) {
    candidates.push(...resolveVariableHolidays(request.year, request.variableHolidays, warnings));
  }
  return { year: request.year, candidates: dedupeAndSort(candidates, warnings), warnings };
}

type ResolveRuleRequest = RuleContext & {
  readonly year: number;
  readonly rulesById: ReadonlyMap<string, RuleContext>;
  readonly overrides: ReadonlyMap<string, NormalizedCalendarRuleOverride>;
  readonly warnedCycles: Set<string>;
  readonly warnings: TemplateResolverWarning[];
  readonly resolving: readonly string[];
};

function resolveDateRule(rule: CalendarDateRule, request: ResolveRuleRequest): RuleResolution {
  switch (rule.kind) {
    case "fixed":
    case "nth-weekday":
    case "last-weekday":
    case "explicit":
    case "relative":
      return resolveSingleRule(rule, request);
    case "range":
      return resolveRangeRule(rule.start, rule.end, request);
    case "month-list":
      return { kind: "none" };
    default:
      return assertNever(rule);
  }
}

function resolveTemplateRuleInstances(request: ResolveRuleRequest): readonly RuleResolution[] {
  const rule = request.rule.rule;
  switch (rule.kind) {
    case "month-list":
      return rule.months.map((month) => resolveRangeRule({ kind: "fixed", month, day: rule.day }, { kind: "fixed", month, day: rule.day }, request));
    case "fixed":
    case "nth-weekday":
    case "last-weekday":
    case "relative":
    case "explicit":
    case "range":
      return [resolveDateRule(rule, request)];
    default:
      return assertNever(rule);
  }
}

function resolveTemplateRule(request: ResolveRuleRequest): readonly ResolvedCalendarStickerCandidate[] {
  const override = request.overrides.get(request.rule.id);
  if (override?.kind === "disabled") return [];

  const catalogEntry = calendarStickerByKey(request.rule.stickerKey);
  if (catalogEntry === undefined || catalogEntry.pack !== request.template.pack) {
    request.warnings.push(warning("STALE_GENERATED_STATE", "error", "Template rule does not match the sticker catalog.", request.rule.id));
    return [];
  }

  const resolutions = override === undefined || override.kind === "default" ? resolveTemplateRuleInstances(request) : [resolveOverride(request.year, override, request.warnings)];
  return resolutions.flatMap((resolved) => {
    if (resolved.kind === "none") return [];
    const base = {
      ruleId: request.rule.id,
      sourceRuleId: request.rule.id,
      stickerKey: request.rule.stickerKey,
      pack: request.template.pack,
      label: catalogEntry.label,
      stickerDate: resolved.date,
      endDate: resolved.kind === "range" && resolved.endDate !== resolved.date ? resolved.endDate : null,
      note: request.rule.note ?? null,
      requiresConfirmation: request.rule.requiresConfirmation,
      templateId: request.template.id,
      templateVersion: request.template.version,
      sortOrder: catalogEntry.sortOrder,
    };
    return [{ ...base, ...(request.rule.metadata === undefined ? {} : { metadata: request.rule.metadata }) }];
  });
}

function resolveSingleRule(rule: CalendarSingleDateRule, request: ResolveRuleRequest): RuleResolution {
  switch (rule.kind) {
    case "fixed":
      return readInYear(formatLocalDate({ year: request.year, month: rule.month, day: rule.day }), request.year, request.rule.id, request.warnings);
    case "nth-weekday": {
      const date = nthWeekdayOfMonth({ year: request.year, month: rule.month, weekday: rule.weekday, occurrence: rule.occurrence });
      return date === null ? invalidDate(request.rule.id, request.warnings) : { kind: "single", date };
    }
    case "last-weekday":
      return { kind: "single", date: lastWeekdayOfMonth(request.year, rule.month, rule.weekday) };
    case "explicit":
      return readInYear(rule.date, request.year, request.rule.id, request.warnings);
    case "relative":
      return resolveRelativeRule(rule.anchorRuleId, rule.offsetDays, request);
    default:
      return assertNever(rule);
  }
}

function resolveRangeRule(start: CalendarSingleDateRule, end: CalendarSingleDateRule, request: ResolveRuleRequest): RuleResolution {
  const startDate = resolveRangeEndpoint(start, request);
  const endDate = resolveRangeEndpoint(end, request);
  if (startDate.kind === "none" || endDate.kind === "none") return { kind: "none" };
  if (startDate.date < `${request.year}-01-01` || endDate.date > `${request.year}-12-31`) {
    request.warnings.push(warning("RANGE_OUT_OF_YEAR", "warning", "Range rule crosses the requested calendar year.", request.rule.id));
    return { kind: "none" };
  }
  if (startDate.date > endDate.date) return invalidDate(request.rule.id, request.warnings);
  return { kind: "range", date: startDate.date, endDate: endDate.date };
}

function resolveRangeEndpoint(rule: CalendarSingleDateRule, request: ResolveRuleRequest): RuleResolution {
  switch (rule.kind) {
    case "explicit": {
      const parsed = parseLocalDate(rule.date);
      if (parsed === null) return invalidDate(request.rule.id, request.warnings, rule.date);
      return { kind: "single", date: formatLocalDate(parsed) };
    }
    case "fixed":
    case "nth-weekday":
    case "last-weekday":
    case "relative":
      return resolveSingleRule(rule, request);
    default:
      return assertNever(rule);
  }
}

function resolveRelativeRule(anchorRuleId: string, offsetDays: number, request: ResolveRuleRequest): RuleResolution {
  const anchor = request.rulesById.get(anchorRuleId);
  if (anchor === undefined) {
    request.warnings.push(warning("MISSING_ANCHOR", "error", "Relative rule anchor does not exist.", request.rule.id));
    return { kind: "none" };
  }
  const cycleKey = `${request.rule.id}:${anchorRuleId}`;
  if (request.warnedCycles.has(cycleKey)) return { kind: "none" };
  if (anchorRuleId === request.rule.id || request.resolving.includes(anchorRuleId)) {
    request.warnedCycles.add(cycleKey);
    request.warnings.push(warning("RELATIVE_ANCHOR_CYCLE", "error", "Relative rule anchor cycle detected.", request.rule.id));
    return { kind: "none" };
  }
  const anchorOverride = request.overrides.get(anchorRuleId);
  if (anchorOverride?.kind === "disabled") {
    request.warnings.push(warning("RELATIVE_ANCHOR_DISABLED", "warning", "Relative rule anchor is disabled by override.", request.rule.id));
    return { kind: "none" };
  }
  const anchorRequest = { ...request, template: anchor.template, rule: anchor.rule, resolving: [...request.resolving, request.rule.id] };
  const resolved = anchorOverride === undefined || anchorOverride.kind === "default" ? resolveDateRule(anchor.rule.rule, anchorRequest) : resolveOverride(request.year, anchorOverride, request.warnings);
  if (resolved.kind === "none") return { kind: "none" };
  return readInYear(addDays(resolved.date, offsetDays), request.year, request.rule.id, request.warnings);
}

function resolveOverride(year: number, override: NormalizedCalendarRuleOverride, warnings: TemplateResolverWarning[]): RuleResolution {
  switch (override.kind) {
    case "date":
      return readInYear(override.date, year, override.ruleId, warnings);
    case "range": {
      const start = readInYear(override.startDate, year, override.ruleId, warnings);
      const end = readInYear(override.endDate, year, override.ruleId, warnings);
      if (start.kind === "none" || end.kind === "none") return { kind: "none" };
      if (start.date > end.date) {
        warnings.push(warning("INVALID_OVERRIDE", "warning", "Override end date is earlier than its start date.", override.ruleId));
        return { kind: "none" };
      }
      return { kind: "range", date: start.date, endDate: end.date };
    }
    case "disabled":
    case "default":
      return { kind: "none" };
    default:
      return assertNever(override);
  }
}

function resolveVariableHolidays(
  year: number,
  entries: ResolveCalendarTemplatesRequest["variableHolidays"],
  warnings: TemplateResolverWarning[],
): readonly ResolvedCalendarStickerCandidate[] {
  if (entries === undefined || entries.length === 0) {
    warnings.push({ ...warning("VARIABLE_HOLIDAY_DATASET_MISSING", "warning", `Variable holiday dataset omitted: ${VARIABLE_HOLIDAY_KEYS.join(", ")}.`), omittedKeys: VARIABLE_HOLIDAY_KEYS });
    return [];
  }

  const seen = new Set<string>();
  const candidates: ResolvedCalendarStickerCandidate[] = [];
  for (const entry of entries) {
    if (entry.sourceYear !== year || entry.year !== year) {
      warnings.push(warning("INVALID_YEAR", "warning", "Variable holiday entry does not match the requested year.", entry.ruleId, entry.date));
      continue;
    }
    const date = readInYear(entry.date, year, entry.ruleId, warnings);
    const catalogEntry = calendarStickerByKey(entry.stickerKey);
    if (date.kind === "none") continue;
    if (entry.pack !== "holiday" || catalogEntry === undefined || catalogEntry.pack !== "holiday") {
      warnings.push({ ...warning("INVALID_VARIABLE_HOLIDAY", "warning", "Variable holiday entry is not a holiday catalog key.", entry.ruleId, entry.date), stickerKey: entry.stickerKey });
      continue;
    }
    const identity = `${entry.date}:${entry.stickerKey}`;
    if (seen.has(identity)) {
      warnings.push({ ...warning("DUPLICATE_DATASET_ENTRY", "warning", "Variable holiday dataset contains a duplicate date and key.", entry.ruleId, entry.date), stickerKey: entry.stickerKey });
      continue;
    }
    seen.add(identity);
    candidates.push({
      ruleId: entry.ruleId,
      sourceRuleId: entry.ruleId,
      stickerKey: entry.stickerKey,
      pack: "holiday",
      label: catalogEntry.label,
      stickerDate: entry.date,
      endDate: null,
      note: null,
      requiresConfirmation: false,
      templateId: "variable-holiday-dataset",
      templateVersion: `source-${entry.sourceYear}`,
      sortOrder: catalogEntry.sortOrder,
    });
  }
  return candidates;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled resolver variant ${JSON.stringify(value)}`);
}
