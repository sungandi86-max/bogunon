import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import type { CalendarStickerRow, EventRow } from "@/types/database";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), useSearchParams: () => new URLSearchParams("date=2026-07-18&view=month") }));

const workflow = { templates: [], templateChecklistItems: [], checklistItems: [], taskLinks: [], eventLinks: [], taskReminders: [], eventReminders: [] };
const event: EventRow = { id: "event-1", user_id: "user", title: "보건교육", area: "healthWork", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false, start_time: "14:00:00", end_time: "15:00:00", location: "시청각실", memo: null, description: null, created_at: "", updated_at: "" };

describe("CalendarWorkspace", () => {
  beforeEach(() => replace.mockClear());

  it("navigates to weekly view and back to today through URL state", () => {
    render(<CalendarWorkspace events={[event]} initialDate="2026-07-18" initialView="month" stickers={[]} tasks={[]} today="2026-07-18" workflow={workflow} />);
    expect(screen.queryByRole("button", { name: "운동" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "주간" }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("view=week"));
    fireEvent.click(screen.getByRole("button", { name: "오늘 날짜로 이동" }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("date=2026-07-18"));
  });

  it("searches event location and navigates to the result date", () => {
    render(<CalendarWorkspace events={[event]} initialDate="2026-07-18" initialView="month" stickers={[]} tasks={[]} today="2026-07-18" workflow={workflow} />);
    fireEvent.change(screen.getByRole("textbox", { name: "캘린더 검색" }), { target: { value: "시청각실" } });
    fireEvent.click(screen.getByRole("option", { name: /보건교육/ }));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("highlight=event%3Aevent-1"));
  });

  it("renders entry filters, sticker filters, and the sticker action as separate controls", () => {
    render(<CalendarWorkspace events={[event]} initialDate="2026-07-18" initialView="month" stickers={[]} tasks={[]} today="2026-07-18" workflow={workflow} />);
    const entryFilters = screen.getByRole("group", { name: "일정 종류 필터" });
    const stickerFilters = screen.getByRole("group", { name: "스티커 표시 필터" });
    expect(within(entryFilters).getAllByRole("button").map((button) => button.textContent)).toEqual(["전체", "업무", "학교", "개인"]);
    expect(within(stickerFilters).getAllByRole("button").map((button) => button.textContent)).toEqual(["전체", "학교", "학사일정", "보건업무", "공휴일", "개인"]);
    expect(screen.getByRole("button", { name: "날짜 스티커 추가" })).not.toHaveAttribute("aria-pressed");
  });

  it("keeps entry and sticker filter state independent", () => {
    const stickers: CalendarStickerRow[] = [
      { id: "school-sticker", user_id: "user", sticker_key: "vacation-ceremony" as const, sticker_date: "2026-07-18", end_date: null, label: "방학식", note: null, created_at: "", updated_at: "" },
      { id: "holiday-sticker", user_id: "user", sticker_key: "holiday.hangul-day" as const, sticker_date: "2026-07-18", end_date: null, label: "한글날", note: null, created_at: "", updated_at: "" },
      { id: "personal-sticker", user_id: "user", sticker_key: "personal.hospital" as const, sticker_date: "2026-07-18", end_date: null, label: "병원", note: null, created_at: "", updated_at: "" },
    ];
    render(<CalendarWorkspace events={[event]} initialDate="2026-07-18" initialView="month" stickers={stickers} tasks={[]} today="2026-07-18" workflow={workflow} />);
    const entryFilters = screen.getByRole("group", { name: "일정 종류 필터" });
    const stickerFilters = screen.getByRole("group", { name: "스티커 표시 필터" });
    fireEvent.click(within(entryFilters).getByRole("button", { name: "업무" }));
    fireEvent.click(within(stickerFilters).getByRole("button", { name: "개인" }));
    expect(within(entryFilters).getByRole("button", { name: "업무" })).toHaveAttribute("aria-pressed", "true");
    expect(within(stickerFilters).getByRole("button", { name: "개인" })).toHaveAttribute("aria-pressed", "true");
    const cell = screen.getByRole("gridcell", { name: /2026-07-18/ });
    expect(cell).toHaveTextContent("병원");
    expect(cell).not.toHaveTextContent("방학식");
    expect(cell).not.toHaveTextContent("한글날");
    expect(cell).toHaveTextContent("보건교육");
  });

  it("filters holiday stickers without mutating the entry filter", () => {
    const stickers: CalendarStickerRow[] = [
      { id: "academic-sticker", user_id: "user", sticker_key: "vacation-ceremony" as const, sticker_date: "2026-07-18", end_date: null, label: "방학식", note: null, created_at: "", updated_at: "" },
      { id: "health-sticker", user_id: "user", sticker_key: "health.student-checkup" as const, sticker_date: "2026-07-18", end_date: null, label: "학생건강검진", note: null, created_at: "", updated_at: "" },
      { id: "holiday-sticker", user_id: "user", sticker_key: "holiday.hangul-day" as const, sticker_date: "2026-07-18", end_date: null, label: "한글날", note: null, created_at: "", updated_at: "" },
      { id: "personal-sticker", user_id: "user", sticker_key: "personal.hospital" as const, sticker_date: "2026-07-18", end_date: null, label: "병원", note: null, created_at: "", updated_at: "" },
    ];
    render(<CalendarWorkspace events={[event]} initialDate="2026-07-18" initialView="month" stickers={stickers} tasks={[]} today="2026-07-18" workflow={workflow} />);
    const entryFilters = screen.getByRole("group", { name: "일정 종류 필터" });
    const stickerFilters = screen.getByRole("group", { name: "스티커 표시 필터" });

    fireEvent.click(within(entryFilters).getByRole("button", { name: "업무" }));
    fireEvent.click(within(stickerFilters).getByRole("button", { name: "공휴일" }));

    expect(within(entryFilters).getByRole("button", { name: "업무" })).toHaveAttribute("aria-pressed", "true");
    expect(within(stickerFilters).getByRole("button", { name: "공휴일" })).toHaveAttribute("aria-pressed", "true");
    const cell = screen.getByRole("gridcell", { name: /2026-07-18/ });
    expect(cell).toHaveTextContent("한글날");
    expect(cell).toHaveTextContent("보건교육");
    expect(cell).not.toHaveTextContent("방학식");
    expect(cell).not.toHaveTextContent("학생건강검진");
    expect(cell).not.toHaveTextContent("병원");
  });
});
