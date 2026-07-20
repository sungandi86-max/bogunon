import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SchoolStickerPicker } from "@/components/calendar/school-sticker-picker";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";
import { HOLIDAY_CALENDAR_STICKERS } from "@/lib/calendar-stickers/catalog";
import type { CalendarStickerRow } from "@/types/database";

const actions = vi.hoisted(() => ({ attach: vi.fn(), remove: vi.fn() }));

vi.mock("@/app/(app)/calendar-sticker-actions", () => ({
  attachCalendarStickerAction: actions.attach,
  removeCalendarStickerAction: actions.remove,
}));

const personalSticker: CalendarStickerRow = {
  id: "a5000000-0000-4000-8000-000000000003",
  user_id: "user",
  sticker_key: "personal.hospital",
  sticker_date: "2026-07-18",
  end_date: null,
  label: "병원",
  note: null,
  created_at: "",
  updated_at: "",
};

function renderPicker(stickers: readonly CalendarStickerRow[] = []) {
  return render(<AppShellCreateContext value={{ openCreate: vi.fn() }}><SchoolStickerPicker stickers={stickers} today="2026-07-18" /></AppShellCreateContext>);
}

describe("SchoolStickerPicker", () => {
  it("shows responsive school, academic, health, holiday, and personal pack tabs in pack order", () => {
    renderPicker();
    const tablist = screen.getByRole("tablist", { name: "날짜 스티커 팩" });
    expect(within(tablist).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["학교", "학사일정", "보건업무", "공휴일", "개인"]);
    expect(screen.getByRole("tab", { name: "학교" })).toHaveAttribute("aria-selected", "true");
  });

  it("searches academic exam and vacation stickers and filters by category", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("tab", { name: "학사일정" }));
    const search = screen.getByRole("searchbox", { name: "스티커 검색" });
    fireEvent.change(search, { target: { value: "시험" } });
    expect(screen.getByRole("button", { name: "7월 18일 중간고사 스티커 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 18일 수행평가 스티커 선택" })).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "방학" } });
    expect(screen.getByRole("button", { name: "7월 18일 여름방학 스티커 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 18일 방학캠프 스티커 선택" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "7월 18일 여름방학 스티커 선택" }));
    expect(screen.getByRole("button", { name: "여름방학 추가" })).toBeEnabled();
    fireEvent.change(search, { target: { value: "시험" } });
    expect(screen.getByRole("button", { name: "스티커를 선택하세요" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "스티커 검색어 지우기" }));
    fireEvent.click(screen.getByRole("button", { name: "시험" }));
    expect(screen.getAllByRole("button", { name: /스티커 선택$/ })).toHaveLength(5);
  });

  it("does not persist a sticker until the explicit save action", async () => {
    actions.attach.mockResolvedValue({ status: "success", message: "입학식 스티커를 붙였어요." });
    renderPicker();
    fireEvent.click(screen.getByRole("tab", { name: "학사일정" }));
    fireEvent.click(screen.getByRole("button", { name: "7월 18일 입학식 스티커 선택" }));
    expect(actions.attach).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "7월 18일 입학식 스티커 선택" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "입학식 추가" }));
    await waitFor(() => expect(actions.attach).toHaveBeenCalledTimes(1));
    const formData = actions.attach.mock.calls[0]?.[1];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData?.get("stickerKey")).toBe("academic.admission");
  });

  it("offers club as an all-day lavender school event that can be changed to a timed event", () => {
    const openCreate = vi.fn();
    const clubSticker: CalendarStickerRow = { ...personalSticker, id: "a5000000-0000-4000-8000-000000000004", sticker_key: "academic.club", label: "동아리" };
    render(<AppShellCreateContext value={{ openCreate }}><SchoolStickerPicker stickers={[clubSticker]} today="2026-07-18" /></AppShellCreateContext>);
    fireEvent.click(screen.getByRole("tab", { name: "학사일정" }));
    expect(screen.getByRole("button", { name: "7월 18일 동아리 스티커 선택" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "학교 일정으로 만들기" }));
    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "event", expect.objectContaining({ area: "schoolSchedule", title: "동아리", isAllDay: true, colorKey: "lavender" }));
  });

  it("shows health categories and searches health stickers by school terms", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("tab", { name: "보건업무" }));
    expect(screen.getByRole("button", { name: "건강검사" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "보건교육" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "운영·점검" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "행정·협업" })).toBeInTheDocument();

    const search = screen.getByRole("searchbox", { name: "스티커 검색" });
    expect(search).toHaveAttribute("type", "search");
    fireEvent.change(search, { target: { value: "검사" } });
    expect(screen.getByRole("button", { name: "7월 18일 학생건강검진 스티커 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 18일 구강검사 스티커 선택" })).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "교육" } });
    expect(screen.getByRole("button", { name: "7월 18일 심폐소생술 교육 스티커 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 18일 비만예방교육 스티커 선택" })).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "CPR" } });
    expect(screen.getByRole("button", { name: "7월 18일 심폐소생술 교육 스티커 선택" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "7월 18일 응급처치 교육 스티커 선택" })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "담임" } });
    expect(screen.getByRole("button", { name: "7월 18일 담임 협조 요청 스티커 선택" })).toBeInTheDocument();
  });

  it("clears hidden health selections when pack, category, or search hides them", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("tab", { name: "보건업무" }));
    fireEvent.click(screen.getByRole("button", { name: "7월 18일 학생건강검진 스티커 선택" }));
    expect(screen.getByRole("button", { name: "학생건강검진 추가" })).toBeEnabled();

    fireEvent.click(screen.getByRole("tab", { name: "보건업무" }));
    fireEvent.click(screen.getByRole("button", { name: "건강검사" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "스티커 검색" }), { target: { value: "건강검진" } });
    expect(screen.getByRole("button", { name: "학생건강검진 추가" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "스티커 검색어 지우기" }));
    expect(screen.getByRole("button", { name: "학생건강검진 추가" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "보건교육" }));
    expect(screen.getByRole("button", { name: "스티커를 선택하세요" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "7월 18일 심폐소생술 교육 스티커 선택" }));
    expect(screen.getByRole("button", { name: "심폐소생술 교육 추가" })).toBeEnabled();
    fireEvent.change(screen.getByRole("searchbox", { name: "스티커 검색" }), { target: { value: "담임" } });
    expect(screen.getByRole("button", { name: "스티커를 선택하세요" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "전체" }));
    fireEvent.click(screen.getByRole("button", { name: "7월 18일 담임 협조 요청 스티커 선택" }));
    expect(screen.getByRole("button", { name: "담임 협조 요청 추가" })).toBeEnabled();
    fireEvent.click(screen.getByRole("tab", { name: "개인" }));
    expect(screen.getByRole("button", { name: "스티커를 선택하세요" })).toBeDisabled();
  });

  it("shows holiday categories, searches required holiday terms, and clears hidden holiday selections", () => {
    const { container } = renderPicker();
    fireEvent.click(screen.getByRole("tab", { name: "공휴일" }));
    const categoryGroup = screen.getByRole("group", { name: "공휴일 카테고리" });
    expect(within(categoryGroup).getAllByRole("button").map((button) => button.textContent)).toEqual(["전체", "국가 공휴일", "명절", "대체·특별 휴일", "일반 휴일"]);
    expect(screen.getByText("20개의 스티커가 표시됩니다.")).toBeInTheDocument();

    fireEvent.click(within(categoryGroup).getByRole("button", { name: "국가 공휴일" }));
    expect(screen.getByText("11개의 스티커가 표시됩니다.")).toBeInTheDocument();
    fireEvent.click(within(categoryGroup).getByRole("button", { name: "명절" }));
    expect(screen.getByText("4개의 스티커가 표시됩니다.")).toBeInTheDocument();
    fireEvent.click(within(categoryGroup).getByRole("button", { name: "대체·특별 휴일" }));
    expect(screen.getByText("4개의 스티커가 표시됩니다.")).toBeInTheDocument();
    fireEvent.click(within(categoryGroup).getByRole("button", { name: "일반 휴일" }));
    expect(screen.getByText("1개의 스티커가 표시됩니다.")).toBeInTheDocument();

    const search = screen.getByRole("searchbox", { name: "스티커 검색" });
    fireEvent.click(within(categoryGroup).getByRole("button", { name: "전체" }));
    fireEvent.change(search, { target: { value: "새해" } });
    expect(screen.getByRole("button", { name: "7월 18일 신정 스티커 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 18일 설날 스티커 선택" })).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "명절" } });
    expect(screen.getAllByRole("button", { name: /스티커 선택$/ })).toHaveLength(4);

    fireEvent.change(search, { target: { value: "휴일" } });
    expect(screen.getByRole("button", { name: "7월 18일 대체공휴일 스티커 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 18일 임시공휴일 스티커 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 18일 연휴 스티커 선택" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 18일 공휴일 스티커 선택" })).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "크리스마스" } });
    expect(screen.getByRole("button", { name: "7월 18일 성탄절 스티커 선택" })).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "한글" } });
    expect(screen.getByRole("button", { name: "7월 18일 한글날 스티커 선택" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "7월 18일 한글날 스티커 선택" }));
    expect(screen.getByRole("button", { name: "한글날 추가" })).toBeEnabled();

    fireEvent.click(within(categoryGroup).getByRole("button", { name: "명절" }));
    expect(screen.getByRole("button", { name: "스티커를 선택하세요" })).toBeDisabled();
    expect(container.querySelector<HTMLInputElement>('input[name="stickerKey"]')?.value).toBe("");

    fireEvent.change(search, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "7월 18일 설날 스티커 선택" }));
    expect(screen.getByRole("button", { name: "설날 추가" })).toBeEnabled();
    fireEvent.change(search, { target: { value: "투표" } });
    expect(screen.getByRole("button", { name: "스티커를 선택하세요" })).toBeDisabled();
    expect(container.querySelector<HTMLInputElement>('input[name="stickerKey"]')?.value).toBe("");

    fireEvent.click(within(categoryGroup).getByRole("button", { name: "전체" }));
    fireEvent.change(search, { target: { value: "석가탄신일" } });
    expect(screen.getByRole("button", { name: "7월 18일 부처님 오신 날 스티커 선택" })).toBeInTheDocument();
    expect(HOLIDAY_CALENDAR_STICKERS).toHaveLength(20);
  });

  it("shows an actionable empty search state and clears the query", () => {
    renderPicker();
    const search = screen.getByRole("searchbox", { name: "스티커 검색" });
    fireEvent.change(search, { target: { value: "없는검색어" } });
    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("검색어를 지우고 다시 찾아보세요.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "검색 초기화" }));
    expect(search).toHaveValue("");
    expect(screen.queryByText("검색 결과가 없습니다.")).not.toBeInTheDocument();
  });

  it("updates the sticky action label for a selected date range", () => {
    renderPicker();
    fireEvent.click(screen.getByRole("tab", { name: "공휴일" }));
    fireEvent.click(screen.getByRole("button", { name: "7월 18일 공휴일 스티커 선택" }));
    fireEvent.click(screen.getByRole("combobox", { name: "종료일" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "날짜 선택" })).getByRole("button", { name: "20" }));
    expect(screen.getByRole("button", { name: "3일간 추가" })).toBeEnabled();
  });

  it("opens the existing Event form with personal defaults only after user choice", () => {
    const openCreate = vi.fn();
    render(<AppShellCreateContext value={{ openCreate }}><SchoolStickerPicker stickers={[personalSticker]} today="2026-07-18" /></AppShellCreateContext>);
    fireEvent.click(screen.getByRole("tab", { name: "개인" }));
    fireEvent.click(screen.getByRole("button", { name: "개인 일정도 만들기" }));
    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "event", expect.objectContaining({ area: "personal", title: "병원", isAllDay: true }));
  });
});
