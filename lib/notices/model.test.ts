import { describe, expect, it } from "vitest";
import { isAdminRole, sortNotices, visibleNotice } from "@/lib/notices/model";

describe("notice role and visibility", () => {
  it("allows admin and owner roles when checking administration", () => {
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("owner")).toBe(true);
  });

  it("shows only published notices inside their publication window", () => {
    const now = new Date("2026-07-20T03:00:00.000Z");
    expect(visibleNotice({ isPublished: true, publishStartAt: "2026-07-20T00:00:00.000Z", publishEndAt: null }, now)).toBe(true);
    expect(visibleNotice({ isPublished: false, publishStartAt: null, publishEndAt: null }, now)).toBe(false);
    expect(visibleNotice({ isPublished: true, publishStartAt: "2026-07-21T00:00:00.000Z", publishEndAt: null }, now)).toBe(false);
    expect(visibleNotice({ isPublished: true, publishStartAt: null, publishEndAt: "2026-07-19T00:00:00.000Z" }, now)).toBe(false);
  });

  it("sorts important notices first and newest notices within each group", () => {
    const result = sortNotices([
      { id: "old", isImportant: false, publishStartAt: null, createdAt: "2026-07-01T00:00:00Z" },
      { id: "important", isImportant: true, publishStartAt: null, createdAt: "2026-06-01T00:00:00Z" },
      { id: "new", isImportant: false, publishStartAt: null, createdAt: "2026-07-20T00:00:00Z" },
    ]);
    expect(result.map(({ id }) => id)).toEqual(["important", "new", "old"]);
  });
});
