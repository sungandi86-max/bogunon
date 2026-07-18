import { describe, expect, it } from "vitest";

import { HEALTH_PRESETS } from "@/lib/work-items/health-presets";
import {
  HEALTH_YEARLY_PRESETS,
  yearlyPresetTemplate,
} from "@/lib/annual-planner/health-yearly-presets";

describe("health yearly presets", () => {
  it("shows recommendations for every month from January through December", () => {
    expect(HEALTH_YEARLY_PRESETS.map((month) => month.month)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(HEALTH_YEARLY_PRESETS.every((month) => month.items.length >= 3)).toBe(true);
  });

  it("reuses the shared health preset registry for matching recommendations", () => {
    const annualHealthLog = HEALTH_YEARLY_PRESETS[2]?.items.find((item) => item.presetKey === "health-log");
    const sharedHealthLog = HEALTH_PRESETS.find((item) => item.key === "health-log");
    if (!annualHealthLog || !sharedHealthLog) throw new Error("보건일지 프리셋이 필요합니다.");

    expect(annualHealthLog.presetKey).toBe(sharedHealthLog.key);
    expect(yearlyPresetTemplate(annualHealthLog)).toMatchObject({
      checklist: sharedHealthLog.checklist,
      recurrenceFrequency: sharedHealthLog.recurrenceFrequency,
    });
  });

  it("keeps the date empty until the user confirms a day in the create form", () => {
    const screening = HEALTH_YEARLY_PRESETS[4]?.items.find((item) => item.title === "학생건강검진 준비");
    if (!screening) throw new Error("학생건강검진 준비 프리셋이 필요합니다.");
    const template = yearlyPresetTemplate(screening);

    expect(template.scheduledDate).toBeUndefined();
    expect(template.startDate).toBeUndefined();
    expect(template.endDate).toBeUndefined();
  });
});
