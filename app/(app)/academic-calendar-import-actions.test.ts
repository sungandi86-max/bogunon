import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkAcademicDuplicatesAction, importAcademicCalendarAction } from "@/app/(app)/academic-calendar-import-actions";
import { insertAcademicEvents, listAcademicSchoolEvents } from "@/lib/academic-calendar-import/repository";

vi.mock("@/lib/academic-calendar-import/repository", () => ({
  insertAcademicEvents: vi.fn(),
  listAcademicSchoolEvents: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("academic calendar import action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listAcademicSchoolEvents).mockResolvedValue([]);
    vi.mocked(insertAcademicEvents).mockResolvedValue({ inserted: 1, failed: 0 });
  });

  it("saves only selected rows as all-day school events", async () => {
    const result = await importAcademicCalendarAction([
      { title: "개학식", startDate: "2026-03-02", endDate: "2026-03-02", selected: true, allowDuplicate: false },
      { title: "제외", startDate: "2026-03-03", endDate: "2026-03-03", selected: false, allowDuplicate: false },
    ]);

    expect(insertAcademicEvents).toHaveBeenCalledWith([expect.objectContaining({
      title: "개학식", area: "schoolSchedule", is_all_day: true, start_time: null, end_time: null,
    })]);
    expect(result).toEqual(expect.objectContaining({ status: "success", inserted: 1, excluded: 1 }));
  });

  it("ignores invalid rows that the preview leaves unselected", async () => {
    const result = await importAcademicCalendarAction([
      { title: "개학식", startDate: "2026-03-02", endDate: "2026-03-02", selected: true, allowDuplicate: false },
      { title: "날짜 오류", startDate: "", endDate: "", selected: false, allowDuplicate: false },
      { title: "", startDate: "2026-03-03", endDate: "2026-03-03", selected: false, allowDuplicate: false },
    ]);

    expect(insertAcademicEvents).toHaveBeenCalledWith([expect.objectContaining({ title: "개학식" })]);
    expect(result).toEqual(expect.objectContaining({ inserted: 1, excluded: 2 }));
  });

  it("skips an exact duplicate unless the user explicitly allows it", async () => {
    vi.mocked(listAcademicSchoolEvents).mockResolvedValue([{
      id: "existing", user_id: "user", title: "개학식", area: "schoolSchedule",
      start_date: "2026-03-02", end_date: "2026-03-02", is_all_day: true,
      start_time: null, end_time: null, memo: null, description: null, created_at: "", updated_at: "",
    }]);
    const duplicate = { title: "개학식", startDate: "2026-03-02", endDate: "2026-03-02", selected: true, allowDuplicate: false };

    const skipped = await importAcademicCalendarAction([duplicate]);
    const allowed = await importAcademicCalendarAction([{ ...duplicate, allowDuplicate: true }]);

    expect(skipped).toEqual(expect.objectContaining({ inserted: 0, duplicates: 1 }));
    expect(insertAcademicEvents).toHaveBeenCalledTimes(1);
    expect(allowed).toEqual(expect.objectContaining({ inserted: 1 }));
  });

  it("skips repeated rows from the same import batch", async () => {
    const repeated = { title: "개학식", startDate: "2026-03-02", endDate: "2026-03-02", selected: true, allowDuplicate: false };

    const result = await importAcademicCalendarAction([repeated, repeated]);

    expect(insertAcademicEvents).toHaveBeenCalledWith([expect.objectContaining({ title: "개학식" })]);
    expect(result).toEqual(expect.objectContaining({ inserted: 1, duplicates: 1 }));
  });

  it("rejects payloads above the bounded batch size", async () => {
    const tooMany = Array.from({ length: 1001 }, (_, index) => ({
      title: `일정 ${index}`, startDate: "2026-03-02", endDate: "2026-03-02", selected: true, allowDuplicate: false,
    }));
    const result = await importAcademicCalendarAction(tooMany);
    expect(result.status).toBe("error");
    expect(insertAcademicEvents).not.toHaveBeenCalled();
  });

  it("rejects impossible selected dates at the server boundary", async () => {
    const result = await importAcademicCalendarAction([
      { title: "잘못된 날짜", startDate: "2026-02-30", endDate: "2026-02-30", selected: true, allowDuplicate: false },
    ]);

    expect(result.status).toBe("error");
    expect(insertAcademicEvents).not.toHaveBeenCalled();
  });

  it("bounds and validates duplicate-check requests", async () => {
    await expect(checkAcademicDuplicatesAction(null)).rejects.toThrow("분석한 일정 내용을 다시 확인해 주세요.");
    await expect(checkAcademicDuplicatesAction(Array.from({ length: 1001 }, () => ({})))).rejects.toThrow("분석한 일정 내용을 다시 확인해 주세요.");
    expect(listAcademicSchoolEvents).not.toHaveBeenCalled();
  });
});
