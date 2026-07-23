import { warning } from "@/lib/calendar-generator/template-resolver-support";
import type { CalendarRuleOverride } from "@/lib/calendar-generator/types";
import type { TemplateResolverWarning } from "@/lib/calendar-generator/template-resolver-types";

export type NormalizedCalendarRuleOverride =
  | { readonly kind: "disabled"; readonly ruleId: string }
  | { readonly kind: "default"; readonly ruleId: string }
  | { readonly kind: "date"; readonly ruleId: string; readonly date: string }
  | { readonly kind: "range"; readonly ruleId: string; readonly startDate: string; readonly endDate: string };

export function normalizeOverrides(
  overrides: readonly CalendarRuleOverride[],
  rulesById: ReadonlyMap<string, unknown>,
  warnings: TemplateResolverWarning[],
): ReadonlyMap<string, NormalizedCalendarRuleOverride> {
  const counts = new Map<string, number>();
  for (const override of overrides) {
    counts.set(override.ruleId, (counts.get(override.ruleId) ?? 0) + 1);
  }

  const duplicatesWarned = new Set<string>();
  const normalized = new Map<string, NormalizedCalendarRuleOverride>();
  for (const override of overrides) {
    if (!rulesById.has(override.ruleId)) {
      warnings.push(invalidOverrideWarning(override.ruleId));
      continue;
    }
    if ((counts.get(override.ruleId) ?? 0) > 1) {
      if (!duplicatesWarned.has(override.ruleId)) warnings.push(invalidOverrideWarning(override.ruleId));
      duplicatesWarned.add(override.ruleId);
      continue;
    }
    const parsed = normalizeOverride(override);
    if (parsed === null) {
      warnings.push(invalidOverrideWarning(override.ruleId));
      continue;
    }
    normalized.set(override.ruleId, parsed);
  }
  return normalized;
}

function normalizeOverride(override: CalendarRuleOverride): NormalizedCalendarRuleOverride | null {
  const hasDate = override.date !== undefined;
  const hasStartDate = override.startDate !== undefined;
  const hasEndDate = override.endDate !== undefined && override.endDate !== null;
  if (override.enabled === false) {
    return hasDate || hasStartDate || hasEndDate ? null : { kind: "disabled", ruleId: override.ruleId };
  }
  if (hasDate && (hasStartDate || hasEndDate)) return null;
  if (hasStartDate || hasEndDate) {
    if (override.startDate === undefined || override.endDate === undefined || override.endDate === null) return null;
    return { kind: "range", ruleId: override.ruleId, startDate: override.startDate, endDate: override.endDate };
  }
  if (hasDate) return { kind: "date", ruleId: override.ruleId, date: override.date };
  return override.enabled === true ? { kind: "default", ruleId: override.ruleId } : null;
}

function invalidOverrideWarning(ruleId: string): TemplateResolverWarning {
  return warning("INVALID_OVERRIDE", "warning", "Rule override is missing conflicting or duplicated.", ruleId);
}
