import { describe, expect, it } from "vitest";

import { DEFAULT_USER_SETTINGS, settingsInputSchema } from "@/lib/settings/domain";

describe("user settings", () => {
  it("uses the requested defaults when no settings row exists", () => {
    expect(DEFAULT_USER_SETTINGS).toEqual({
      weekStartsOn: "monday",
      defaultEventMinutes: 30,
      eventRemindersEnabled: true,
      taskDueRemindersEnabled: true,
      exerciseEnabled: true,
      writingAssistanceEnabled: true,
      displayDensity: "default",
    });
  });

  it("rejects invalid durations and density values", () => {
    expect(settingsInputSchema.safeParse({ ...DEFAULT_USER_SETTINGS, defaultEventMinutes: 0 }).success).toBe(false);
    expect(settingsInputSchema.safeParse({ ...DEFAULT_USER_SETTINGS, displayDensity: "tiny" }).success).toBe(false);
  });
});
