import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  importNeisAcademicCalendarAction,
  loadNeisSchedulesAction,
  searchNeisSchoolsAction,
} from "@/app/(app)/neis-academic-calendar-actions";
import { AcademicCalendarImportMethods } from "@/components/calendar/academic-calendar-import-methods";

vi.mock("@/app/(app)/neis-academic-calendar-actions", () => ({
  searchNeisSchoolsAction: vi.fn(),
  loadNeisSchedulesAction: vi.fn(),
  importNeisAcademicCalendarAction: vi.fn(),
}));

describe("NEIS academic calendar import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchNeisSchoolsAction).mockResolvedValue({
      status: "success",
      schools: [{ officeCode: "B10", schoolCode: "7010082", name: "상계고등학교", type: "고등학교", region: "서울특별시", officeName: "서울특별시교육청", address: "서울특별시 노원구 노해로 432" }],
    });
    vi.mocked(loadNeisSchedulesAction).mockResolvedValue({
      status: "success",
      items: [
        { id: "a", date: "2026-03-02", title: "개학식", content: "전교생 등교", grades: ["전 학년"], status: "ready", selected: true },
        { id: "b", date: "2026-03-03", title: "입학식", content: "체육관", grades: ["1학년"], status: "duplicate", selected: false },
      ],
    });
    vi.mocked(importNeisAcademicCalendarAction).mockResolvedValue({ status: "success", message: "완료", inserted: 1, excluded: 1, duplicates: 0, failed: 0 });
  });

  it("keeps both NEIS and file import methods available", () => {
    render(<AcademicCalendarImportMethods />);

    expect(screen.getByRole("button", { name: "NEIS 자동 불러오기" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Excel/CSV 파일 가져오기" }));
    expect(screen.getByText(/학교에서 받은 엑셀 또는 CSV 파일/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excel/CSV 파일 가져오기" })).toHaveAttribute("aria-pressed", "true");
  });

  it("searches a school, previews schedules, and saves only selected rows", async () => {
    render(<AcademicCalendarImportMethods />);
    fireEvent.change(screen.getByLabelText(/학교명/), { target: { value: "상계고" } });
    fireEvent.click(screen.getByRole("button", { name: "학교 검색" }));

    const result = await screen.findByRole("button", { name: /상계고등학교 선택/ });
    expect(result).toHaveTextContent("서울특별시 노원구 노해로 432");
    fireEvent.click(result);
    expect(screen.getByText("선택한 학교")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "학사일정 조회" }));

    const preview = await screen.findByRole("list", { name: "NEIS 학사일정 미리보기" });
    expect(within(preview).getByText("개학식")).toBeInTheDocument();
    expect(within(preview).getByText("전교생 등교")).toBeInTheDocument();
    expect(within(preview).getByText("이미 등록됨")).toBeInTheDocument();
    expect(screen.getByText("전체 2개 · 선택 1개")).toBeInTheDocument();

    const saveButton = await screen.findByRole("button", { name: "선택한 일정 1개 저장" });
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() => expect(importNeisAcademicCalendarAction).toHaveBeenCalledWith([
      { id: "a", date: "2026-03-02", title: "개학식", selected: true },
      { id: "b", date: "2026-03-03", title: "입학식", selected: false },
    ]));
    expect(await screen.findByRole("heading", { name: "NEIS 학사일정 등록 완료" })).toBeInTheDocument();
    expect(screen.getByText("1개 저장 · 0개 중복 제외 · 1개 선택 제외 · 0개 실패")).toBeInTheDocument();
  });

  it("supports select all and clear without selecting duplicates", async () => {
    render(<AcademicCalendarImportMethods />);
    fireEvent.change(screen.getByLabelText(/학교명/), { target: { value: "상계고" } });
    fireEvent.click(screen.getByRole("button", { name: "학교 검색" }));
    fireEvent.click(await screen.findByRole("button", { name: /상계고등학교 선택/ }));
    fireEvent.click(screen.getByRole("button", { name: "학사일정 조회" }));
    await screen.findByText("개학식");

    fireEvent.click(screen.getByRole("button", { name: "전체 해제" }));
    expect(screen.getByText("전체 2개 · 선택 0개")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "전체 선택" }));
    expect(screen.getByText("전체 2개 · 선택 1개")).toBeInTheDocument();
  });

  it("shows empty and friendly error states", async () => {
    vi.mocked(searchNeisSchoolsAction).mockResolvedValueOnce({ status: "success", schools: [] });
    const { rerender } = render(<AcademicCalendarImportMethods />);
    fireEvent.change(screen.getByLabelText(/학교명/), { target: { value: "없는학교" } });
    fireEvent.click(screen.getByRole("button", { name: "학교 검색" }));
    expect(await screen.findByText("검색 결과가 없습니다.")).toBeInTheDocument();

    vi.mocked(searchNeisSchoolsAction).mockResolvedValueOnce({ status: "error", code: "network-error", message: "NEIS 서비스에 연결하지 못했습니다." });
    rerender(<AcademicCalendarImportMethods />);
    fireEvent.click(screen.getByRole("button", { name: "학교 검색" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("NEIS 서비스에 연결하지 못했습니다.");
  });

  it("allows searching by education office without a school name", async () => {
    render(<AcademicCalendarImportMethods />);
    fireEvent.change(screen.getByLabelText("시도교육청"), { target: { value: "B10" } });
    fireEvent.click(screen.getByRole("button", { name: "학교 검색" }));

    await waitFor(() => expect(searchNeisSchoolsAction).toHaveBeenCalledWith({ query: "", officeCode: "B10" }));
  });
});
