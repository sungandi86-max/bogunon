import { MAX_SUPPORTED_YEAR, MIN_SUPPORTED_YEAR, SUPPORTED_CALENDAR_PACKS } from "@/lib/calendar-generator/constants";
import { formatLocalDate, parseLocalDate } from "@/lib/calendar-generator/date-utils";
import type {
  ResolvedCalendarStickerCandidate,
  TemplateResolverWarning,
  TemplateResolverWarningCode,
} from "@/lib/calendar-generator/template-resolver-types";

export type RuleResolution =
  | { readonly kind: "none" }
  | { readonly kind: "single"; readonly date: string }
  | { readonly kind: "range"; readonly date: string; readonly endDate: string };

const PACK_ORDER = new Map(SUPPORTED_CALENDAR_PACKS.map((pack, index) => [pack, index]));

export function isSupportedYear(year: number): boolean {
  return Number.isInteger(year) && year >= MIN_SUPPORTED_YEAR && year <= MAX_SUPPORTED_YEAR;
}

export function readInYear(value: string, year: number, ruleId: string, warnings: TemplateResolverWarning[]): RuleResolution {
  const parsed = parseLocalDate(value);
  if (parsed === null || parsed.year !== year) return invalidDate(ruleId, warnings, value);
  return { kind: "single", date: value };
}

export function invalidDate(ruleId: string, warnings: TemplateResolverWarning[], date?: string): RuleResolution {
  warnings.push(warning("INVALID_DATE", "warning", "Rule resolved to an invalid date.", ruleId, date));
  return { kind: "none" };
}

export function addDays(value: string, days: number): string {
  const parts = parseLocalDate(value);
  if (parts === null) return value;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  const formatted = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  const parsed = parseLocalDate(formatted);
  return parsed === null ? value : formatLocalDate(parsed);
}

export function dedupeAndSort(
  candidates: readonly ResolvedCalendarStickerCandidate[],
  warnings: TemplateResolverWarning[],
): readonly ResolvedCalendarStickerCandidate[] {
  const seen = new Set<string>();
  const sorted = candidates.toSorted((left, right) =>
    left.stickerDate.localeCompare(right.stickerDate)
    || (PACK_ORDER.get(left.pack) ?? 99) - (PACK_ORDER.get(right.pack) ?? 99)
    || left.sortOrder - right.sortOrder
  );
  return sorted.filter((candidate) => {
    const identity = `${candidate.stickerDate}:${candidate.stickerKey}`;
    if (seen.has(identity)) {
      warnings.push({ ...warning("DUPLICATE_TEMPLATE_CANDIDATE", "warning", "Candidate date and sticker key is duplicated.", candidate.sourceRuleId, candidate.stickerDate), stickerKey: candidate.stickerKey });
      return false;
    }
    seen.add(identity);
    return true;
  });
}

export function warning(
  code: TemplateResolverWarningCode,
  severity: TemplateResolverWarning["severity"],
  message: string,
  ruleId?: string,
  date?: string,
): TemplateResolverWarning {
  return { code, severity, message, ...(ruleId === undefined ? {} : { ruleId }), ...(date === undefined ? {} : { date }) };
}
