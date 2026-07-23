import { describe, expect, it } from "vitest";

import { validateCalendarTemplates } from "@/lib/calendar-generator/template-validation";
import { BUILT_IN_CALENDAR_TEMPLATES } from "@/lib/calendar-generator/templates";
import { HOLIDAY_TEMPLATE } from "@/lib/calendar-generator/templates/holiday-template";
import type { CalendarTemplateDefinition } from "@/lib/calendar-generator/types";

describe("calendar template validation", () => {
  it("returns no errors for every built-in template", () => {
    // Given
    const templates = BUILT_IN_CALENDAR_TEMPLATES;

    // When
    const result = validateCalendarTemplates(templates);

    // Then
    expect(result.isValid).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("returns a structured error when a template references a missing catalog key", () => {
    // Given
    const template = replaceFirstRule(HOLIDAY_TEMPLATE, { stickerKey: "holiday.missing" });

    // When
    const result = validateCalendarTemplates([template]);

    // Then
    expect(result.isValid).toBe(false);
    expect(result.warnings).toContainEqual({
      code: "MISSING_TEMPLATE_KEY",
      severity: "error",
      message: "Template rule references a catalog key that does not exist.",
      templateId: "holiday-v1",
      ruleId: "holiday-new-year",
      stickerKey: "holiday.missing",
    });
  });

  it("returns a structured error when a catalog key belongs to another pack", () => {
    // Given
    const template = replaceFirstRule(HOLIDAY_TEMPLATE, { stickerKey: "academic.midterm" });

    // When
    const result = validateCalendarTemplates([template]);

    // Then
    expect(result.isValid).toBe(false);
    expect(result.warnings).toContainEqual({
      code: "TEMPLATE_PACK_MISMATCH",
      severity: "error",
      message: "Template rule catalog pack does not match the template pack.",
      templateId: "holiday-v1",
      ruleId: "holiday-new-year",
      stickerKey: "academic.midterm",
      expectedPack: "holiday",
      actualPack: "academic",
    });
  });

  it("returns structured errors for duplicate rule ids and duplicate date-key entries", () => {
    // Given
    const duplicateRule = HOLIDAY_TEMPLATE.rules[0];
    const template = {
      ...HOLIDAY_TEMPLATE,
      rules: [...HOLIDAY_TEMPLATE.rules, duplicateRule],
    } satisfies CalendarTemplateDefinition;

    // When
    const result = validateCalendarTemplates([template]);

    // Then
    expect(result.isValid).toBe(false);
    expect(result.warnings).toEqual(expect.arrayContaining([
      {
        code: "DUPLICATE_TEMPLATE_RULE_ID",
        severity: "error",
        message: "Template rule id is duplicated.",
        templateId: "holiday-v1",
        ruleId: "holiday-new-year",
      },
      {
        code: "DUPLICATE_TEMPLATE_ENTRY",
        severity: "error",
        message: "Template contains a duplicate sticker key and date policy entry.",
        templateId: "holiday-v1",
        ruleId: "holiday-new-year",
        stickerKey: "holiday.new-year",
      },
    ]));
  });

  it("returns a structured error for malformed fixed date rules", () => {
    // Given
    const template = replaceFirstRule(HOLIDAY_TEMPLATE, { rule: { kind: "fixed", month: 2, day: 31 } });

    // When
    const result = validateCalendarTemplates([template]);

    // Then
    expect(result.isValid).toBe(false);
    expect(result.warnings).toContainEqual({
      code: "TEMPLATE_RULE_INVALID",
      severity: "error",
      message: "Template rule has an invalid date policy.",
      templateId: "holiday-v1",
      ruleId: "holiday-new-year",
      stickerKey: "holiday.new-year",
    });
  });

  it("returns structured errors for impossible explicit dates and month-list days", () => {
    // Given
    const explicitTemplate = replaceFirstRule(HOLIDAY_TEMPLATE, { rule: { kind: "explicit", date: "2026-99-99" } });
    const monthListTemplate = replaceFirstRule(HOLIDAY_TEMPLATE, {
      id: "holiday-month-list",
      rule: { kind: "month-list", months: [2], day: 31 },
    });

    // When
    const result = validateCalendarTemplates([explicitTemplate, monthListTemplate]);

    // Then
    expect(result.isValid).toBe(false);
    expect(result.warnings.filter((warning) => warning.code === "TEMPLATE_RULE_INVALID")).toEqual([
      {
        code: "TEMPLATE_RULE_INVALID",
        severity: "error",
        message: "Template rule has an invalid date policy.",
        templateId: "holiday-v1",
        ruleId: "holiday-new-year",
        stickerKey: "holiday.new-year",
      },
      {
        code: "TEMPLATE_RULE_INVALID",
        severity: "error",
        message: "Template rule has an invalid date policy.",
        templateId: "holiday-v1",
        ruleId: "holiday-month-list",
        stickerKey: "holiday.new-year",
      },
    ]);
  });

  it("returns structured errors for unordered ranges and empty relative anchors", () => {
    // Given
    const rangeTemplate = replaceFirstRule(HOLIDAY_TEMPLATE, {
      rule: {
        kind: "range",
        start: { kind: "fixed", month: 3, day: 2 },
        end: { kind: "fixed", month: 3, day: 1 },
      },
    });
    const relativeTemplate = replaceFirstRule(HOLIDAY_TEMPLATE, {
      id: "holiday-empty-anchor",
      rule: { kind: "relative", anchorRuleId: "", offsetDays: 1 },
    });

    // When
    const result = validateCalendarTemplates([rangeTemplate, relativeTemplate]);

    // Then
    expect(result.isValid).toBe(false);
    expect(result.warnings.filter((warning) => warning.code === "TEMPLATE_RULE_INVALID")).toHaveLength(2);
  });
});

type RulePatch = Partial<CalendarTemplateDefinition["rules"][number]>;

function replaceFirstRule(template: CalendarTemplateDefinition, patch: RulePatch): CalendarTemplateDefinition {
  const firstRule = template.rules.at(0);
  if (firstRule === undefined) {
    throw new Error("Test fixture requires at least one template rule.");
  }

  return {
    ...template,
    rules: [
      {
        ...firstRule,
        ...patch,
      },
      ...template.rules.slice(1),
    ],
  };
}
