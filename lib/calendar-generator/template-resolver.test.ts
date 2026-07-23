import { describe, expect, it } from "vitest";

import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import { resolveCalendarTemplates } from "@/lib/calendar-generator/template-resolver";
import { HOLIDAY_TEMPLATE } from "@/lib/calendar-generator/templates/holiday-template";
import type { CalendarTemplateDefinition } from "@/lib/calendar-generator/types";

const ALL_RULE_VARIANTS_TEMPLATE = {
  id: "resolver-fixture-v1",
  version: "1.2.3",
  pack: "academic",
  rules: [
    { id: "fixed", stickerKey: "academic.midterm", rule: { kind: "fixed", month: 4, day: 24 }, requiresConfirmation: true },
    { id: "nth", stickerKey: "academic.diagnostic-assessment", rule: { kind: "nth-weekday", month: 3, weekday: 1, occurrence: 2 }, requiresConfirmation: true },
    { id: "last", stickerKey: "academic.parent-meeting", rule: { kind: "last-weekday", month: 2, weekday: 5 }, requiresConfirmation: true },
    { id: "relative", stickerKey: "academic.final", rule: { kind: "relative", anchorRuleId: "fixed", offsetDays: 1 }, requiresConfirmation: true },
    { id: "explicit", stickerKey: "opening-ceremony", rule: { kind: "explicit", date: "2028-02-29" }, requiresConfirmation: true },
    {
      id: "range",
      stickerKey: "academic.summer-break",
      rule: { kind: "range", start: { kind: "fixed", month: 7, day: 25 }, end: { kind: "fixed", month: 8, day: 20 } },
      requiresConfirmation: true,
    },
    { id: "month-list", stickerKey: "academic.performance-assessment", rule: { kind: "month-list", months: [3, 9], day: 15 }, requiresConfirmation: true },
  ],
} as const satisfies CalendarTemplateDefinition;

describe("calendar template resolver", () => {
  it("resolves every rule variant into catalog-backed date candidates", () => {
    // Given
    const metadata = { schoolAdjustment: { suggestedRule: "Check school plan.", confirmationReason: "Draft." } };
    const template = withFirstRuleMetadata(ALL_RULE_VARIANTS_TEMPLATE, metadata);

    // When
    const result = resolveCalendarTemplates({ year: 2028, templates: [template] });

    // Then
    expect(result.warnings).toEqual([]);
    expect(result.candidates.map((candidate) => [candidate.sourceRuleId, candidate.stickerDate, candidate.endDate])).toEqual([
      ["last", "2028-02-25", null],
      ["explicit", "2028-02-29", null],
      ["nth", "2028-03-13", null],
      ["month-list", "2028-03-15", null],
      ["fixed", "2028-04-24", null],
      ["relative", "2028-04-25", null],
      ["range", "2028-07-25", "2028-08-20"],
      ["month-list", "2028-09-15", null],
    ]);
    expect(result.candidates[4]).toMatchObject({
      ruleId: "fixed",
      sourceRuleId: "fixed",
      stickerKey: "academic.midterm",
      label: calendarStickerByKey("academic.midterm")?.label,
      pack: "academic",
      templateId: "resolver-fixture-v1",
      templateVersion: "1.2.3",
      metadata,
      requiresConfirmation: true,
      sortOrder: calendarStickerByKey("academic.midterm")?.sortOrder,
    });
  });

  it("applies disabled date and range overrides without mutating template inputs", () => {
    // Given
    const originalDate = HOLIDAY_TEMPLATE.rules[9]?.rule;
    const overrides = [
      { ruleId: "holiday-new-year", enabled: false },
      { ruleId: "holiday-christmas", startDate: "2028-12-24", endDate: "2028-12-26" },
    ] as const;

    // When
    const result = resolveCalendarTemplates({ year: 2028, templates: [HOLIDAY_TEMPLATE], overrides });

    // Then
    expect(result.candidates.some((candidate) => candidate.sourceRuleId === "holiday-new-year")).toBe(false);
    expect(result.candidates.find((candidate) => candidate.sourceRuleId === "holiday-christmas")).toMatchObject({
      stickerDate: "2028-12-24",
      endDate: "2028-12-26",
    });
    expect(HOLIDAY_TEMPLATE.rules[9]?.rule).toEqual(originalDate);
  });

  it("warns and ignores invalid override shapes without changing candidates", () => {
    // Given
    const overrides = [
      { ruleId: "fixed", enabled: false, date: "2028-05-10" },
      { ruleId: "nth", enabled: true, endDate: "2028-03-20" },
      { ruleId: "last", date: "2028-02-26", startDate: "2028-02-24" },
      { ruleId: "explicit", startDate: "2028-03-01" },
      { ruleId: "range", date: "2028-07-26", endDate: "2028-08-21" },
    ] as const;

    // When
    const result = resolveCalendarTemplates({ year: 2028, templates: [ALL_RULE_VARIANTS_TEMPLATE], overrides });

    // Then
    expect(result.warnings.filter((warning) => warning.code === "INVALID_OVERRIDE")).toHaveLength(5);
    expect(result.candidates.map((candidate) => [candidate.sourceRuleId, candidate.stickerDate, candidate.endDate])).toEqual([
      ["last", "2028-02-25", null],
      ["explicit", "2028-02-29", null],
      ["nth", "2028-03-13", null],
      ["month-list", "2028-03-15", null],
      ["fixed", "2028-04-24", null],
      ["relative", "2028-04-25", null],
      ["range", "2028-07-25", "2028-08-20"],
      ["month-list", "2028-09-15", null],
    ]);
  });

  it("warns and ignores every duplicate override for a rule without later wins", () => {
    // Given
    const overrides = [
      { ruleId: "fixed", date: "2028-05-10" },
      { ruleId: "fixed", date: "2028-06-10" },
    ] as const;

    // When
    const result = resolveCalendarTemplates({ year: 2028, templates: [ALL_RULE_VARIANTS_TEMPLATE], overrides });

    // Then
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_OVERRIDE", ruleId: "fixed" }));
    expect(result.candidates.find((candidate) => candidate.sourceRuleId === "fixed")).toMatchObject({ stickerDate: "2028-04-24" });
    expect(result.candidates.find((candidate) => candidate.sourceRuleId === "relative")).toMatchObject({ stickerDate: "2028-04-25" });
  });

  it("resolves relative rules from overridden anchor dates", () => {
    // Given
    const result = resolveCalendarTemplates({
      year: 2028,
      templates: [ALL_RULE_VARIANTS_TEMPLATE],
      overrides: [{ ruleId: "fixed", enabled: true, date: "2028-05-10" }],
    });

    // When
    const relative = result.candidates.find((candidate) => candidate.sourceRuleId === "relative");

    // Then
    expect(result.warnings).toEqual([]);
    expect(relative).toMatchObject({ stickerDate: "2028-05-11" });
  });

  it("omits relative rules with disabled anchors and returns a structured warning", () => {
    // Given
    const result = resolveCalendarTemplates({
      year: 2028,
      templates: [ALL_RULE_VARIANTS_TEMPLATE],
      overrides: [{ ruleId: "fixed", enabled: false }],
    });

    // When
    const relative = result.candidates.find((candidate) => candidate.sourceRuleId === "relative");

    // Then
    expect(relative).toBeUndefined();
    expect(result.warnings).toContainEqual(expect.objectContaining({
      code: "RELATIVE_ANCHOR_DISABLED",
      ruleId: "relative",
    }));
  });

  it("returns structured warnings for invalid years overrides ranges and relative anchors", () => {
    // Given
    const problemTemplate = {
      id: "resolver-problems-v1",
      version: "1.0.0",
      pack: "holiday",
      rules: [
        { id: "missing", stickerKey: "holiday", rule: { kind: "relative", anchorRuleId: "absent", offsetDays: 1 }, requiresConfirmation: false },
        { id: "cycle-a", stickerKey: "holiday.substitute", rule: { kind: "relative", anchorRuleId: "cycle-b", offsetDays: 1 }, requiresConfirmation: false },
        { id: "cycle-b", stickerKey: "holiday.temporary", rule: { kind: "relative", anchorRuleId: "cycle-a", offsetDays: 1 }, requiresConfirmation: false },
        {
          id: "cross-year",
          stickerKey: "holiday.chuseok-break",
          rule: { kind: "range", start: { kind: "fixed", month: 12, day: 30 }, end: { kind: "explicit", date: "2029-01-02" } },
          requiresConfirmation: false,
        },
      ],
    } as const satisfies CalendarTemplateDefinition;

    // When
    const invalidYear = resolveCalendarTemplates({ year: 1999, templates: [HOLIDAY_TEMPLATE] });
    const result = resolveCalendarTemplates({
      year: 2028,
      templates: [problemTemplate],
      overrides: [
        { ruleId: "holiday-new-year", enabled: false, date: "2028-01-02" },
        { ruleId: "missing-rule", enabled: true, date: "2028-01-02" },
      ],
    });

    // Then
    expect(invalidYear.candidates).toEqual([]);
    expect(invalidYear.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_YEAR", severity: "error" }));
    expect(result.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "INVALID_OVERRIDE",
      "MISSING_ANCHOR",
      "RELATIVE_ANCHOR_CYCLE",
      "RANGE_OUT_OF_YEAR",
    ]));
  });

  it("uses valid variable holiday data and rejects wrong-year impossible or non-holiday entries", () => {
    // Given
    const variableHolidays = [
      { ruleId: "seollal-2028", stickerKey: "holiday.seollal", pack: "holiday", sourceYear: 2028, year: 2028, date: "2028-01-26" },
      { ruleId: "seollal-duplicate", stickerKey: "holiday.seollal", pack: "holiday", sourceYear: 2028, year: 2028, date: "2028-01-26" },
      { ruleId: "wrong-source", stickerKey: "holiday.chuseok", pack: "holiday", sourceYear: 2027, year: 2028, date: "2028-10-03" },
      { ruleId: "wrong-date-year", stickerKey: "holiday.chuseok", pack: "holiday", sourceYear: 2028, year: 2028, date: "2029-10-03" },
      { ruleId: "non-holiday", stickerKey: "academic.midterm", pack: "holiday", sourceYear: 2028, year: 2028, date: "2028-04-24" },
    ] as const;

    // When
    const result = resolveCalendarTemplates({ year: 2028, templates: [HOLIDAY_TEMPLATE], variableHolidays });

    // Then
    expect(result.candidates.filter((candidate) => candidate.stickerKey === "holiday.seollal")).toHaveLength(1);
    expect(result.candidates.find((candidate) => candidate.stickerKey === "holiday.seollal")).toMatchObject({
      sourceRuleId: "seollal-2028",
      stickerDate: "2028-01-26",
      pack: "holiday",
      templateId: "variable-holiday-dataset",
    });
    expect(result.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "DUPLICATE_DATASET_ENTRY",
      "INVALID_YEAR",
      "INVALID_DATE",
      "INVALID_VARIABLE_HOLIDAY",
    ]));
  });

  it("keeps fixed holidays and reports omitted variable keys when no variable dataset is supplied", () => {
    // Given
    const request = { year: 2028, templates: [HOLIDAY_TEMPLATE] };

    // When
    const result = resolveCalendarTemplates(request);

    // Then
    expect(result.candidates).toHaveLength(10);
    expect(result.warnings).toContainEqual(expect.objectContaining({
      code: "VARIABLE_HOLIDAY_DATASET_MISSING",
      severity: "warning",
      message: expect.stringContaining("holiday.seollal"),
    }));
  });

  it("deduplicates template and dataset candidates by date and sticker key", () => {
    // Given
    const seollalTemplate = {
      id: "seollal-template-v1",
      version: "1.0.0",
      pack: "holiday",
      rules: [
        { id: "template-seollal", stickerKey: "holiday.seollal", rule: { kind: "fixed", month: 1, day: 26 }, requiresConfirmation: false },
      ],
    } as const satisfies CalendarTemplateDefinition;

    // When
    const result = resolveCalendarTemplates({
      year: 2028,
      templates: [seollalTemplate],
      variableHolidays: [
        { ruleId: "dataset-seollal", stickerKey: "holiday.seollal", pack: "holiday", sourceYear: 2028, year: 2028, date: "2028-01-26" },
      ],
    });

    // Then
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.sourceRuleId).toBe("template-seollal");
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "DUPLICATE_TEMPLATE_CANDIDATE" }));
  });
});

function withFirstRuleMetadata(
  template: CalendarTemplateDefinition,
  metadata: CalendarTemplateDefinition["rules"][number]["metadata"],
): CalendarTemplateDefinition {
  const firstRule = template.rules[0];
  if (firstRule === undefined) {
    throw new Error("Test fixture requires at least one template rule.");
  }
  const firstRuleWithMetadata = metadata === undefined ? firstRule : { ...firstRule, metadata };
  return {
    ...template,
    rules: [firstRuleWithMetadata, ...template.rules.slice(1)],
  };
}
