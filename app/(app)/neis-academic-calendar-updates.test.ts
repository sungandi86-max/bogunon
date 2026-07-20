import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDefaultNeisSchoolAction,
  importNeisAcademicCalendarAction,
  loadNeisSchedulesAction,
  saveDefaultNeisSchoolAction,
} from "@/app/(app)/neis-academic-calendar-actions";
import {
  insertAcademicEvents,
  listAcademicSchoolEvents,
  requireAcademicImportUser,
  updateAcademicEventDescriptions,
} from "@/lib/academic-calendar-import/repository";
import { fetchNeisSchedules } from "@/lib/neis/client";
import {
  getDefaultNeisSchool,
  upsertDefaultNeisSchool,
} from "@/lib/neis/school-settings";

vi.mock("@/lib/academic-calendar-import/repository", () => ({
  insertAcademicEvents: vi.fn(),
  listAcademicSchoolEvents: vi.fn(),
  requireAcademicImportUser: vi.fn(),
  updateAcademicEventDescriptions: vi.fn(),
}));
vi.mock("@/lib/neis/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/neis/client")>();
  return { ...original, fetchNeisSchedules: vi.fn() };
});
vi.mock("@/lib/neis/school-settings", () => ({
  getDefaultNeisSchool: vi.fn(),
  upsertDefaultNeisSchool: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const existingEvent = {
  id: "event-1",
  user_id: "user-1",
  title: "기말고사",
  area: "schoolSchedule" as const,
  start_date: "2026-07-20",
  end_date: "2026-07-20",
  is_all_day: true,
  start_time: null,
  end_time: null,
  memo: null,
  description: "기존 상세",
  created_at: "",
  updated_at: "",
};

describe("NEIS school defaults and schedule updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAcademicImportUser).mockResolvedValue("user-1");
    vi.mocked(listAcademicSchoolEvents).mockResolvedValue([]);
    vi.mocked(insertAcademicEvents).mockResolvedValue({ inserted: 1, failed: 0 });
    vi.mocked(updateAcademicEventDescriptions).mockResolvedValue({ updated: 1, failed: 0 });
  });

  it("loads and saves the authenticated user's default school", async () => {
    const school = {
      officeCode: "B10",
      schoolCode: "7010082",
      name: "여의도고등학교",
      officeName: "서울특별시교육청",
    };
    vi.mocked(getDefaultNeisSchool).mockResolvedValue(school);

    await expect(getDefaultNeisSchoolAction()).resolves.toEqual({ status: "success", school });
    await expect(saveDefaultNeisSchoolAction(school)).resolves.toMatchObject({ status: "success" });
    expect(upsertDefaultNeisSchool).toHaveBeenCalledWith(school);
  });

  it("distinguishes exact duplicates from changed schedule details", async () => {
    vi.mocked(listAcademicSchoolEvents).mockResolvedValue([existingEvent]);
    vi.mocked(fetchNeisSchedules).mockResolvedValue([
      { id: "same", date: "2026-07-20", title: "기말고사", content: "기존 상세", grades: ["3학년"] },
      { id: "changed", date: "2026-07-20", title: "기말고사", content: "변경된 상세", grades: ["3학년"] },
      { id: "new", date: "2026-07-21", title: "진로 체험", content: "강당", grades: ["전 학년"] },
    ]);

    const result = await loadNeisSchedulesAction({
      officeCode: "B10",
      schoolCode: "7010082",
      schoolName: "여의도고등학교",
      fromDate: "2026-07-01",
      toDate: "2026-07-31",
    });

    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error("success expected");
    expect(result.items.map(({ status, selected }) => [status, selected])).toEqual([
      ["duplicate", false],
      ["changed", false],
      ["ready", true],
    ]);
  });

  it("updates changed details only after explicit selection and still inserts new schedules", async () => {
    vi.mocked(listAcademicSchoolEvents).mockResolvedValue([existingEvent]);

    const result = await importNeisAcademicCalendarAction([
      { id: "changed", date: "2026-07-20", title: "기말고사", content: "변경된 상세", selected: true },
      { id: "new", date: "2026-07-21", title: "진로 체험", content: "강당", selected: true },
    ]);

    expect(updateAcademicEventDescriptions).toHaveBeenCalledWith([
      { id: "event-1", description: "변경된 상세" },
    ]);
    expect(insertAcademicEvents).toHaveBeenCalledWith([
      expect.objectContaining({ title: "진로 체험", description: "강당" }),
    ]);
    expect(result).toMatchObject({ status: "success", inserted: 1, updated: 1, duplicates: 0 });
  });
});
