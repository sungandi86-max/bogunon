import { describe, expect, it } from "vitest";

import { markAcademicDuplicates, normalizeAcademicTitle } from "@/lib/academic-calendar-import/duplicates";
import type { AcademicImportItem } from "@/lib/academic-calendar-import/types";
import type { EventRow } from "@/types/database";

const item: AcademicImportItem = {
  id: "row-2", sourceRow: 2, rawDate: "2026-03-02", title: " 개학식 ",
  startDate: "2026-03-02", endDate: "2026-03-02", status: "ready", selected: true,
};

const event: EventRow = {
  id: "event-1", user_id: "user", title: "개학식", area: "schoolSchedule",
  start_date: "2026-03-02", end_date: "2026-03-02", is_all_day: true,
  start_time: null, end_time: null, memo: null, description: null, created_at: "", updated_at: "",
};

describe("academic calendar duplicate detection", () => {
  it("normalizes whitespace, punctuation, and letter case", () => {
    expect(normalizeAcademicTitle("  OPEN---Day  ")).toBe("open day");
  });

  it("marks same-period school events as duplicate and deselects them", () => {
    expect(markAcademicDuplicates([item], [event])[0]).toEqual(expect.objectContaining({ status: "duplicate", selected: false }));
  });

  it("marks repeated rows inside the uploaded file as duplicate", () => {
    const repeated = { ...item, id: "row-5", sourceRow: 5 };
    const result = markAcademicDuplicates([item, repeated], []);

    expect(result[0]).toEqual(expect.objectContaining({ status: "ready", selected: true }));
    expect(result[1]).toEqual(expect.objectContaining({ status: "duplicate", selected: false }));
  });

  it("allows the user to select a duplicate without deleting the existing event", () => {
    const duplicate = markAcademicDuplicates([item], [event])[0];
    expect({ ...duplicate, selected: true }).toEqual(expect.objectContaining({ selected: true, status: "duplicate" }));
    expect(event.title).toBe("개학식");
  });
});
