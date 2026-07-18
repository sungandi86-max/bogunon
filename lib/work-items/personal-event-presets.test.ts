import { describe, expect, it } from "vitest";

import { PERSONAL_EVENT_PRESETS } from "@/lib/work-items/personal-event-presets";

describe("personal event quick choices", () => {
  it("only prefills a personal title and supported pastel color", () => {
    expect(PERSONAL_EVENT_PRESETS.map((item) => item.title)).toEqual(["병원", "약속", "여행", "미용실", "가족 일정", "운동 약속", "기타"]);
    expect(PERSONAL_EVENT_PRESETS.every((item) => item.area === "personal")).toBe(true);
  });
});
