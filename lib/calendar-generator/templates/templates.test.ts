import { describe, expect, it } from "vitest";

import { calendarStickerByKey } from "@/lib/calendar-stickers/catalog";
import { ACADEMIC_TEMPLATE } from "@/lib/calendar-generator/templates/academic-template";
import { HEALTH_TEMPLATE } from "@/lib/calendar-generator/templates/health-template";
import { FIXED_HOLIDAY_RULES, HOLIDAY_TEMPLATE, VARIABLE_HOLIDAY_KEYS } from "@/lib/calendar-generator/templates/holiday-template";
import { BUILT_IN_CALENDAR_TEMPLATES } from "@/lib/calendar-generator/templates";

describe("built-in calendar generator templates", () => {
  it("defines the holiday v1 template with only the ten fixed solar holidays", () => {
    // Given
    const expectedFixedDates = [
      ["holiday.new-year", 1, 1],
      ["holiday.march-first", 3, 1],
      ["holiday.labor-day", 5, 1],
      ["holiday.childrens-day", 5, 5],
      ["holiday.memorial-day", 6, 6],
      ["holiday.constitution-day", 7, 17],
      ["holiday.liberation-day", 8, 15],
      ["holiday.national-foundation-day", 10, 3],
      ["holiday.hangul-day", 10, 9],
      ["holiday.christmas", 12, 25],
    ];

    // When
    const fixedRules = FIXED_HOLIDAY_RULES.map((rule) => [rule.stickerKey, rule.rule.month, rule.rule.day]);

    // Then
    expect(HOLIDAY_TEMPLATE.pack).toBe("holiday");
    expect(HOLIDAY_TEMPLATE.rules).toHaveLength(10);
    expect(fixedRules).toEqual(expectedFixedDates);
    expect(HOLIDAY_TEMPLATE.rules.every((rule) => rule.requiresConfirmation)).toBe(false);
    expect(VARIABLE_HOLIDAY_KEYS).toEqual([
      "holiday.seollal",
      "holiday.seollal-break",
      "holiday.buddhas-birthday",
      "holiday.chuseok",
      "holiday.chuseok-break",
      "holiday.substitute",
      "holiday.temporary",
      "holiday.election-day",
    ]);
  });

  it("keeps academic v1 as nine editable confirmation-required draft rules", () => {
    // Given
    const academicKeys = ACADEMIC_TEMPLATE.rules.map((rule) => rule.stickerKey);

    // When
    const catalogPacks = academicKeys.map((key) => calendarStickerByKey(key)?.pack);

    // Then
    expect(ACADEMIC_TEMPLATE.pack).toBe("academic");
    expect(ACADEMIC_TEMPLATE.rules).toHaveLength(9);
    expect(catalogPacks).toEqual(Array.from({ length: 9 }, () => "academic"));
    expect(ACADEMIC_TEMPLATE.rules.every((rule) => rule.requiresConfirmation)).toBe(true);
    expect(ACADEMIC_TEMPLATE.rules.every((rule) => rule.metadata?.schoolAdjustment?.suggestedRule.length !== 0)).toBe(true);
  });

  it("keeps health v1 as confirmation-required core suggestions plus monthly operational checks", () => {
    // Given
    const monthlyOperationKeys = [
      "health.aed-check",
      "health.medicine-check",
      "health.emergency-kit-check",
      "health.health-room-check",
    ];

    // When
    const monthlyOperationRules = HEALTH_TEMPLATE.rules.filter((rule) => monthlyOperationKeys.includes(rule.stickerKey));
    const catalogPacks = HEALTH_TEMPLATE.rules.map((rule) => calendarStickerByKey(rule.stickerKey)?.pack);

    // Then
    expect(HEALTH_TEMPLATE.pack).toBe("health");
    expect(HEALTH_TEMPLATE.rules).toHaveLength(58);
    expect(monthlyOperationRules).toHaveLength(48);
    expect(catalogPacks).toEqual(Array.from({ length: 58 }, () => "health"));
    expect(HEALTH_TEMPLATE.rules.every((rule) => rule.requiresConfirmation)).toBe(true);
    expect(HEALTH_TEMPLATE.rules.every((rule) => rule.metadata?.schoolAdjustment?.suggestedRule.length !== 0)).toBe(true);
  });

  it("exports the three built-in templates without catalog presentation fields", () => {
    // Given
    const templates = BUILT_IN_CALENDAR_TEMPLATES;

    // When
    const packs = templates.map((template) => template.pack);

    // Then
    expect(packs).toEqual(["holiday", "academic", "health"]);
    for (const template of templates) {
      expect(template).not.toHaveProperty("label");
      for (const rule of template.rules) {
        expect(rule).not.toHaveProperty("label");
        expect(rule).not.toHaveProperty("sortOrder");
      }
    }
  });
});
