import { describe, expect, it } from "vitest";

import {
  CALENDAR_DATE_RULE_KINDS,
  MAX_SUPPORTED_YEAR,
  MIN_SUPPORTED_YEAR,
  SUPPORTED_CALENDAR_PACKS,
} from "@/lib/calendar-generator/constants";
import type { CalendarDateRule, CalendarRuleOverride, CalendarTemplatePack } from "@/lib/calendar-generator/types";

function describeRule(rule: CalendarDateRule): string {
  switch (rule.kind) {
    case "fixed":
      return `${rule.month}-${rule.day}`;
    case "nth-weekday":
      return `${rule.occurrence}-${rule.weekday}`;
    case "last-weekday":
      return `last-${rule.weekday}`;
    case "relative":
      return `${rule.anchorRuleId}-${rule.offsetDays}`;
    case "explicit":
      return rule.date;
    case "range":
      return `${describeRule(rule.start)}..${describeRule(rule.end)}`;
    case "month-list":
      return `${rule.months.join(",")}-${rule.day}`;
    default:
      return assertNever(rule);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled calendar date rule ${JSON.stringify(value)}`);
}

describe("calendar generator shared types", () => {
  it("exports the supported generator packs as readonly literals", () => {
    // Given
    const expected: readonly CalendarTemplatePack[] = ["holiday", "academic", "health"];

    // When
    const packs = SUPPORTED_CALENDAR_PACKS;

    // Then
    expect(packs).toEqual(expected);
  });

  it("exports the supported annual planner year bounds", () => {
    // Given
    const bounds = { min: MIN_SUPPORTED_YEAR, max: MAX_SUPPORTED_YEAR };

    // When
    const supportedRange = `${bounds.min}-${bounds.max}`;

    // Then
    expect(supportedRange).toBe("2000-2100");
  });

  it("covers every calendar date rule kind with an exhaustive union", () => {
    // Given
    const rules = [
      { kind: "fixed", month: 3, day: 1 },
      { kind: "nth-weekday", month: 3, weekday: 1, occurrence: 2 },
      { kind: "last-weekday", month: 3, weekday: 5 },
      { kind: "relative", anchorRuleId: "anchor", offsetDays: -1 },
      { kind: "explicit", date: "2028-02-29" },
      { kind: "range", start: { kind: "fixed", month: 4, day: 1 }, end: { kind: "fixed", month: 4, day: 5 } },
      { kind: "month-list", months: [3, 6, 9, 12], day: 1 },
    ] satisfies readonly CalendarDateRule[];

    // When
    const descriptions = rules.map(describeRule);

    // Then
    expect(CALENDAR_DATE_RULE_KINDS).toEqual([
      "fixed",
      "nth-weekday",
      "last-weekday",
      "relative",
      "explicit",
      "range",
      "month-list",
    ]);
    expect(descriptions).toHaveLength(CALENDAR_DATE_RULE_KINDS.length);
  });

  it("exports the public override shape used by the resolver", () => {
    // Given
    const overrides = [
      { ruleId: "keep-default", enabled: true },
      { ruleId: "disable", enabled: false },
      { ruleId: "single-date", date: "2028-05-10" },
      { ruleId: "range-date", startDate: "2028-12-24", endDate: "2028-12-26" },
    ] satisfies readonly CalendarRuleOverride[];

    // When
    const ruleIds = overrides.map((override) => override.ruleId);

    // Then
    expect(ruleIds).toEqual(["keep-default", "disable", "single-date", "range-date"]);
  });
});
