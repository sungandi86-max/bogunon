import { describe, expect, it } from "vitest";

import {
  defaultHealthPresetPreferences,
  mergeHealthPresetPreferences,
  moveHealthPresetPreference,
  personalizedHealthPresets,
} from "@/lib/work-items/health-preset-personalization";

describe("health preset personalization", () => {
  it("keeps the shared registry while applying favorites, order, and hidden state", () => {
    const preferences = mergeHealthPresetPreferences([
      { presetId: "health-newsletter", favorite: true, sortOrder: 5 },
      { presetId: "health-log", hidden: true, sortOrder: 0 },
    ]);

    const visible = personalizedHealthPresets(preferences);
    expect(visible[0]?.key).toBe("health-newsletter");
    expect(visible.some((preset) => preset.key === "health-log")).toBe(false);
    expect(personalizedHealthPresets(preferences, { includeHidden: true })).toHaveLength(12);
  });

  it("moves a preset without losing favorite or hidden state", () => {
    const initial = defaultHealthPresetPreferences().map((item) => item.presetId === "health-log" ? { ...item, favorite: true } : item);
    const moved = moveHealthPresetPreference(initial, "health-log", 1);

    expect(moved[1]).toMatchObject({ presetId: "health-log", favorite: true, sortOrder: 1 });
    expect(moved).toHaveLength(12);
  });

  it("restores the registry default state", () => {
    expect(defaultHealthPresetPreferences().every((item) => !item.favorite && !item.hidden)).toBe(true);
    expect(defaultHealthPresetPreferences().map((item) => item.sortOrder)).toEqual([...Array(12).keys()]);
  });
});
