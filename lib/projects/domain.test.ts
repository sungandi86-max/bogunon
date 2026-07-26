import { describe, expect, it } from "vitest";

import { projectInputFromFormData } from "@/lib/projects/domain";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("project input", () => {
  it("normalizes optional fields", () => {
    expect(projectInputFromFormData(form({
      name: "  보건교육 준비  ", icon: "school", color: "mint",
      description: "  ", startDate: "", endDate: "",
    }))).toEqual({
      name: "보건교육 준비", icon: "school", color: "mint",
      description: null, start_date: null, end_date: null,
    });
  });

  it("rejects an inverted date range", () => {
    expect(() => projectInputFromFormData(form({
      name: "행사", icon: "calendar", color: "blue",
      startDate: "2026-08-02", endDate: "2026-08-01",
    }))).toThrow("종료일은 시작일 이후로 선택해 주세요.");
  });
});
