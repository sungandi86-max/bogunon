import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  importNeisAcademicCalendarAction,
  loadNeisSchedulesAction,
  searchNeisSchoolsAction,
} from "@/app/(app)/neis-academic-calendar-actions";
import {
  AcademicImportUnauthorizedError,
  insertAcademicEvents,
  listAcademicSchoolEvents,
  requireAcademicImportUser,
} from "@/lib/academic-calendar-import/repository";
import { fetchNeisSchedules, searchNeisSchools } from "@/lib/neis/client";

vi.mock("@/lib/academic-calendar-import/repository", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/academic-calendar-import/repository")>();
  return {
    ...original,
    insertAcademicEvents: vi.fn(),
    listAcademicSchoolEvents: vi.fn(),
    requireAcademicImportUser: vi.fn(),
  };
});
vi.mock("@/lib/neis/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/neis/client")>();
  return { ...original, fetchNeisSchedules: vi.fn(), searchNeisSchools: vi.fn() };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("NEIS academic calendar actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAcademicImportUser).mockResolvedValue("user-1");
    vi.mocked(listAcademicSchoolEvents).mockResolvedValue([]);
    vi.mocked(insertAcademicEvents).mockResolvedValue({ inserted: 1, failed: 0 });
  });

  it("rejects short queries before authentication or external requests", async () => {
    const result = await searchNeisSchoolsAction({ query: "고" });

    expect(result).toMatchObject({ status: "error", code: "invalid-input" });
    expect(requireAcademicImportUser).not.toHaveBeenCalled();
    expect(searchNeisSchools).not.toHaveBeenCalled();
  });

  it("searches only after confirming a login session", async () => {
    vi.mocked(searchNeisSchools).mockResolvedValue([{ officeCode: "B10", schoolCode: "1", name: "상계고", type: "고등학교", region: "서울", officeName: "서울특별시교육청", address: "서울" }]);

    const result = await searchNeisSchoolsAction({ query: "상계고", officeCode: "B10" });

    expect(requireAcademicImportUser).toHaveBeenCalledOnce();
    expect(searchNeisSchools).toHaveBeenCalledWith({ query: "상계고", officeCode: "B10" });
    expect(result).toMatchObject({ status: "success", schools: [{ name: "상계고" }] });
  });

  it("allows an education-office-only search", async () => {
    vi.mocked(searchNeisSchools).mockResolvedValue([]);

    const result = await searchNeisSchoolsAction({ query: "", officeCode: "B10" });

    expect(result).toEqual({ status: "success", schools: [] });
    expect(searchNeisSchools).toHaveBeenCalledWith({ query: "", officeCode: "B10" });
  });

  it("marks existing and same-batch schedules as duplicates", async () => {
    vi.mocked(fetchNeisSchedules).mockResolvedValue([
      { id: "a", date: "2026-03-02", title: "개학식", content: "", grades: ["전 학년"] },
      { id: "b", date: "2026-03-02", title: "개학식", content: "중복", grades: ["전 학년"] },
      { id: "c", date: "2026-03-03", title: "입학식", content: "", grades: ["1학년"] },
    ]);
    vi.mocked(listAcademicSchoolEvents).mockResolvedValue([{
      id: "existing", user_id: "user-1", title: "개학식", area: "schoolSchedule",
      start_date: "2026-03-02", end_date: "2026-03-02", is_all_day: true,
      start_time: null, end_time: null, memo: null, description: null, created_at: "", updated_at: "",
    }]);

    const result = await loadNeisSchedulesAction({ officeCode: "B10", schoolCode: "1", schoolName: "상계고", fromDate: "2026-03-01", toDate: "2026-03-31" });

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("success expected");
    expect(result.items.map((item) => [item.status, item.selected])).toEqual([
      ["duplicate", false], ["changed", false], ["ready", true],
    ]);
  });

  it("rejects impossible or oversized date ranges before external requests", async () => {
    const impossible = await loadNeisSchedulesAction({ officeCode: "B10", schoolCode: "1", schoolName: "상계고", fromDate: "2026-02-30", toDate: "2026-03-31" });
    const oversized = await loadNeisSchedulesAction({ officeCode: "B10", schoolCode: "1", schoolName: "상계고", fromDate: "2026-03-01", toDate: "2027-04-01" });

    expect(impossible).toMatchObject({ status: "error", code: "invalid-input" });
    expect(oversized).toMatchObject({ status: "error", code: "invalid-input" });
    expect(fetchNeisSchedules).not.toHaveBeenCalled();
  });

  it("returns an empty successful preview when NEIS has no schedules", async () => {
    vi.mocked(fetchNeisSchedules).mockResolvedValue([]);

    const result = await loadNeisSchedulesAction({ officeCode: "B10", schoolCode: "1", schoolName: "상계고", fromDate: "2026-03-01", toDate: "2026-03-31" });

    expect(result).toEqual({ status: "success", items: [] });
  });

  it("saves selected non-duplicates using the existing school event format", async () => {
    const result = await importNeisAcademicCalendarAction([
      { id: "a", date: "2026-03-02", title: "개학식", selected: true },
      { id: "b", date: "2026-03-03", title: "입학식", selected: false },
    ]);

    expect(insertAcademicEvents).toHaveBeenCalledWith([expect.objectContaining({
      title: "개학식", area: "schoolSchedule", start_date: "2026-03-02", end_date: "2026-03-02",
      is_all_day: true, start_time: null, end_time: null, color_key: "yellow",
    })]);
    expect(result).toMatchObject({ status: "success", inserted: 1, excluded: 1, duplicates: 0, failed: 0 });
  });

  it("defends against duplicates again on the server at save time", async () => {
    vi.mocked(listAcademicSchoolEvents).mockResolvedValue([{
      id: "existing", user_id: "user-1", title: "개학식", area: "schoolSchedule",
      start_date: "2026-03-02", end_date: "2026-03-02", is_all_day: true,
      start_time: null, end_time: null, memo: null, description: null, created_at: "", updated_at: "",
    }]);

    const result = await importNeisAcademicCalendarAction([
      { id: "a", date: "2026-03-02", title: " 개학식 ", selected: true },
    ]);

    expect(insertAcademicEvents).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "success", inserted: 0, duplicates: 1 });
  });

  it("returns a specific session message instead of exposing internal errors", async () => {
    vi.mocked(requireAcademicImportUser).mockRejectedValue(new AcademicImportUnauthorizedError());

    const result = await searchNeisSchoolsAction({ query: "상계고" });

    expect(result).toEqual(expect.objectContaining({ status: "error", code: "unauthorized", message: "로그인 후 NEIS 학사일정을 이용해 주세요." }));
  });

  it("returns a friendly Supabase save failure without leaking details", async () => {
    vi.mocked(insertAcademicEvents).mockRejectedValue(new Error("database internal detail"));

    const result = await importNeisAcademicCalendarAction([
      { id: "a", date: "2026-03-02", title: "개학식", selected: true },
    ]);

    expect(result).toEqual(expect.objectContaining({ status: "error", code: "save-error", message: "학사일정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }));
    expect(JSON.stringify(result)).not.toContain("database internal detail");
  });
});
