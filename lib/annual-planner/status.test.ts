import { describe, expect, it } from "vitest";

import { annualPresetStatus } from "@/lib/annual-planner/status";

describe("annual preset status", () => {
  const preset = { title: "건강검진 준비", templateTitle: "건강검진 준비" };

  it("marks a matching completed task as completed", () => {
    expect(annualPresetStatus(preset, [
      { kind: "task", title: "건강검진 준비", date: "2026-05-02", completed: true },
    ], 2026)).toBe("completed");
  });

  it("marks a matching dated item as scheduled", () => {
    expect(annualPresetStatus(preset, [
      { kind: "event", title: "건강검진 준비", date: "2026-05-02", completed: false },
    ], 2026)).toBe("scheduled");
  });

  it("does not match an item from another year", () => {
    expect(annualPresetStatus(preset, [
      { kind: "task", title: "건강검진 준비", date: "2025-05-02", completed: false },
    ], 2026)).toBe("none");
  });
});
