import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDefaultNeisSchoolAction,
  importNeisAcademicCalendarAction,
  loadNeisSchedulesAction,
  saveDefaultNeisSchoolAction,
  searchNeisSchoolsAction,
} from "@/app/(app)/neis-academic-calendar-actions";
import { AcademicCalendarImportMethods } from "@/components/calendar/academic-calendar-import-methods";

vi.mock("@/app/(app)/neis-academic-calendar-actions", () => ({
  getDefaultNeisSchoolAction: vi.fn(),
  searchNeisSchoolsAction: vi.fn(),
  saveDefaultNeisSchoolAction: vi.fn(),
  loadNeisSchedulesAction: vi.fn(),
  importNeisAcademicCalendarAction: vi.fn(),
}));

const school = {
  officeCode: "B10",
  schoolCode: "7010082",
  name: "여의도고등학교",
  type: "고등학교",
  region: "서울특별시",
  officeName: "서울특별시교육청",
  address: "서울특별시 영등포구 국제금융로7길 37",
};

const schedules = [
  { id: "saturday", date: "2026-07-04", title: "토요휴업일", content: "", grades: ["전 학년"], status: "ready" as const, selected: true },
  { id: "exam", date: "2026-07-06", title: "기말고사", content: "3학년 교실", grades: ["3학년"], status: "ready" as const, selected: true },
  { id: "holiday", date: "2026-07-17", title: "제헌절", content: "", grades: ["전 학년"], status: "duplicate" as const, selected: false },
  { id: "vacation", date: "2026-07-24", title: "여름방학식", content: "강당에서 진행", grades: ["1학년", "2학년"], status: "changed" as const, selected: false },
];

async function searchAndLoad(): Promise<void> {
  fireEvent.change(screen.getByLabelText("학교명 (선택)"), { target: { value: "여의도고" } });
  fireEvent.click(screen.getByRole("button", { name: "학교 검색" }));
  fireEvent.click(await screen.findByRole("button", { name: "여의도고등학교 선택" }));
  fireEvent.click(screen.getByRole("button", { name: "학사일정 조회" }));
  await screen.findByRole("list", { name: "NEIS 학사일정 미리보기" });
}

describe("NEIS academic calendar import UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDefaultNeisSchoolAction).mockResolvedValue({ status: "success", school: null });
    vi.mocked(searchNeisSchoolsAction).mockResolvedValue({ status: "success", schools: [school] });
    vi.mocked(saveDefaultNeisSchoolAction).mockResolvedValue({ status: "success", message: "기본 학교를 저장했습니다." });
    vi.mocked(loadNeisSchedulesAction).mockResolvedValue({ status: "success", items: schedules });
    vi.mocked(importNeisAcademicCalendarAction).mockResolvedValue({
      status: "success",
      message: "완료",
      inserted: 1,
      updated: 0,
      excluded: 3,
      duplicates: 0,
      failed: 0,
    });
  });

  it("keeps NEIS and Excel/CSV methods available", async () => {
    render(<AcademicCalendarImportMethods />);
    expect(screen.getByRole("button", { name: "NEIS 자동 불러오기" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Excel/CSV 파일 가져오기" }));
    expect(screen.getByRole("button", { name: "Excel/CSV 파일 가져오기" })).toHaveAttribute("aria-pressed", "true");
  });

  it("excludes Saturday closures by default and updates visible and selected counts when toggled", async () => {
    render(<AcademicCalendarImportMethods />);
    await searchAndLoad();

    expect(screen.queryByText("토요휴업일")).not.toBeInTheDocument();
    expect(screen.getByText("전체 4개")).toBeInTheDocument();
    expect(screen.getByText("표시 3개")).toBeInTheDocument();
    expect(screen.getByText("선택 1개")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "토요휴업일 포함" }));
    expect(screen.getByText("토요휴업일")).toBeInTheDocument();
    expect(screen.getByText("표시 4개")).toBeInTheDocument();
    expect(screen.getByText("선택 2개")).toBeInTheDocument();
  });

  it("filters by schedule type and searches title, detail, grade, and date immediately", async () => {
    render(<AcademicCalendarImportMethods />);
    await searchAndLoad();

    fireEvent.click(screen.getByRole("button", { name: "시험" }));
    expect(screen.getByText("기말고사")).toBeInTheDocument();
    expect(screen.queryByText("여름방학식")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "전체" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "일정 검색" }), { target: { value: "1·2학년" } });
    expect(screen.getByText("여름방학식")).toBeInTheDocument();
    expect(screen.queryByText("기말고사")).not.toBeInTheDocument();
    expect(screen.getByText("1·2학년")).toBeInTheDocument();
  });

  it("never submits filtered-out schedules and keeps duplicates disabled", async () => {
    render(<AcademicCalendarImportMethods />);
    await searchAndLoad();

    const preview = screen.getByRole("list", { name: "NEIS 학사일정 미리보기" });
    const duplicateRow = within(preview).getByText("제헌절").closest("label");
    expect(duplicateRow).not.toBeNull();
    expect(within(duplicateRow as HTMLElement).getByRole("checkbox")).toBeDisabled();
    expect(within(duplicateRow as HTMLElement).getByText("이미 등록됨")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "시험" }));
    fireEvent.click(screen.getByRole("button", { name: "새 일정 1개 저장" }));
    await waitFor(() => expect(importNeisAcademicCalendarAction).toHaveBeenCalledWith([
      expect.objectContaining({ id: "saturday", selected: false }),
      expect.objectContaining({ id: "exam", content: "3학년 교실", selected: true }),
      expect.objectContaining({ id: "holiday", selected: false }),
      expect.objectContaining({ id: "vacation", selected: false }),
    ]));
  });

  it("restores the authenticated user's saved school and allows changing it", async () => {
    vi.mocked(getDefaultNeisSchoolAction).mockResolvedValueOnce({
      status: "success",
      school: {
        officeCode: school.officeCode,
        schoolCode: school.schoolCode,
        name: school.name,
        officeName: school.officeName,
      },
    });
    render(<AcademicCalendarImportMethods />);

    expect(await screen.findByText("여의도고등학교")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "학사일정 조회" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "학교 변경" }));
    expect(screen.getByLabelText("학교명 (선택)")).toBeInTheDocument();
  });

  it("does not let a slow saved-school response overwrite the user's school selection", async () => {
    let resolveDefaultSchool!: (value: Awaited<ReturnType<typeof getDefaultNeisSchoolAction>>) => void;
    vi.mocked(getDefaultNeisSchoolAction).mockReturnValueOnce(new Promise((resolve) => {
      resolveDefaultSchool = resolve;
    }));
    render(<AcademicCalendarImportMethods />);

    fireEvent.change(screen.getByLabelText("학교명 (선택)"), { target: { value: "여의도고" } });
    fireEvent.click(screen.getByRole("button", { name: "학교 검색" }));
    fireEvent.click(await screen.findByRole("button", { name: "여의도고등학교 선택" }));

    await act(async () => {
      resolveDefaultSchool({
        status: "success",
        school: { officeCode: "C10", schoolCode: "9999999", name: "이전 기본학교", officeName: "부산광역시교육청" },
      });
    });

    expect(screen.getByText("여의도고등학교")).toBeInTheDocument();
    expect(screen.queryByText("이전 기본학교")).not.toBeInTheDocument();
  });
});
