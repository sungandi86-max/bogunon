import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const healthTask: TaskRow = {
  id: "task-health",
  user_id: "user",
  title: "보건일지 정리",
  area: "healthWork",
  status: "planned",
  priority: "normal",
  category: "other",
  scheduled_date: "2026-07-18",
  due_date: null,
  follow_up_date: null,
  memo: null,
  description: null,
  estimated_minutes: null,
  completed_at: null,
  recurrence_frequency: null,
  recurrence_source_id: null,
  recurrence_date: null,
  recurrence_generated_through: null,
  created_at: "",
  updated_at: "",
};

const schoolEvent: EventRow = {
  id: "event-school",
  user_id: "user",
  title: "교직원 회의",
  area: "schoolSchedule",
  start_date: "2026-07-18",
  end_date: "2026-07-18",
  is_all_day: true,
  start_time: null,
  end_time: null,
  memo: null,
  description: null,
  created_at: "",
  updated_at: "",
};

const personalEvent: EventRow = {
  ...schoolEvent,
  id: "event-personal",
  title: "가족 약속",
  area: "personal",
};

const monthStickerRows = [
  { id: "holiday-1", user_id: "user", sticker_key: "holiday.hangul-day", sticker_date: "2026-07-18", end_date: null, label: "한글날", note: null, created_at: "", updated_at: "" },
  { id: "health-1", user_id: "user", sticker_key: "health.student-checkup", sticker_date: "2026-07-18", end_date: null, label: "학생건강검진", note: null, created_at: "", updated_at: "" },
  { id: "academic-1", user_id: "user", sticker_key: "academic.sports-day", sticker_date: "2026-07-18", end_date: null, label: "체육대회", note: null, created_at: "", updated_at: "" },
  { id: "personal-1", user_id: "user", sticker_key: "personal.hospital", sticker_date: "2026-07-18", end_date: null, label: "병원", note: null, created_at: "", updated_at: "" },
] satisfies readonly CalendarStickerRow[];

describe("FullMonthCalendar", () => {
  it("hydrates with the same initial item limit as the server", async () => {
    const browserWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", { configurable: true, value: undefined });
    const markup = renderToString(<FullMonthCalendar month="2026-06" />);
    Object.defineProperty(globalThis, "window", { configurable: true, value: browserWindow });
    const container = document.createElement("div");
    container.innerHTML = markup;
    document.body.append(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, <FullMonthCalendar month="2026-06" />);
    });

    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("Hydration failed");
    await act(async () => root?.unmount());
    consoleError.mockRestore();
    container.remove();
  });

  it.each([
    ["2026-06", "2026-06-18", 5, 2, 1],
    ["2026-08", "2026-08-18", 6, 1, 2],
  ] as const)("uses the responsive item limit for %s", (month, date, expectedWeeks, visibleItemLimit, hiddenCount) => {
    const events = [
      { ...schoolEvent, id: `${month}-event-1`, title: "교직원 회의", start_date: date, end_date: date },
      { ...schoolEvent, id: `${month}-event-2`, title: "학교 행사", start_date: date, end_date: date },
      { ...schoolEvent, id: `${month}-event-3`, title: "학부모 안내", start_date: date, end_date: date },
    ];

    const { container } = render(<FullMonthCalendar events={events} month={month} today={date} visibleItemLimit={visibleItemLimit} />);
    const cell = screen.getByRole("gridcell", { name: new RegExp(`${date}, 일정 3개`) });

    expect(container.querySelectorAll(".full-calendar__row")).toHaveLength(expectedWeeks);
    expect(cell).toHaveTextContent("교직원 회의");
    expect(cell).toHaveTextContent(`+${hiddenCount}`);
    if (visibleItemLimit === 2) expect(cell).toHaveTextContent("학교 행사");
    else expect(cell).not.toHaveTextContent("학교 행사");
    expect(cell).not.toHaveTextContent("학부모 안내");
  });

  it.each([
    [390, 844, "2026-08", "1"],
    [430, 932, "2026-08", "2"],
    [1280, 800, "2026-06", "4"],
    [1440, 900, "2026-08", "4"],
  ] as const)("derives the visible limit at %sx%s", (width, height, month, expectedLimit) => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
    const { container, unmount } = render(<FullMonthCalendar month={month} />);
    expect(container.querySelector(".full-calendar")).toHaveAttribute("data-visible-item-limit", expectedLimit);
    unmount();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: originalHeight });
  });

  it("orders one unified list and calculates overflow after all item types", () => {
    render(<FullMonthCalendar events={[personalEvent, schoolEvent]} month="2026-07" schoolStickers={monthStickerRows} tasks={[healthTask]} today="2026-07-18" visibleItemLimit={4} />);
    const cell = screen.getByRole("gridcell", { name: /2026-07-18/ });
    const titles = Array.from(cell.querySelectorAll(".calendar-item__title"), (node) => node.textContent);
    expect(titles).toEqual(["가족 약속", "교직원 회의", "보건일지 정리", "학생건강검진"]);
    expect(cell).toHaveTextContent("+3");
    expect(cell).not.toHaveTextContent("한글날");
  });

  it("uses the whole date cell and overflow control to select a date", () => {
    const onSelectDate = vi.fn();
    render(<FullMonthCalendar events={[schoolEvent, personalEvent]} month="2026-07" onSelectDate={onSelectDate} today="2026-07-18" visibleItemLimit={1} />);
    const cell = screen.getByRole("gridcell", { name: /2026-07-18/ });
    fireEvent.click(within(cell).getByRole("button", { name: "2026-07-18 선택" }));
    expect(onSelectDate).toHaveBeenLastCalledWith("2026-07-18");
    fireEvent.click(within(cell).getByRole("button", { name: "숨겨진 일정 1개 모두 보기" }));
    expect(onSelectDate).toHaveBeenCalledTimes(2);
  });

  it("marks the supplied current date on its calendar cell", () => {
    const { container } = render(<FullMonthCalendar month="2026-07" today="2026-07-18" />);

    expect(Array.from(container.querySelectorAll(".full-calendar__weekdays span"), (node) => node.textContent)).toEqual(["일", "월", "화", "수", "목", "금", "토"]);
    expect(container.querySelectorAll(".full-calendar__cell")[3]).toHaveAccessibleName("2026-07-01, 일정 0개, 업무 0개, 스티커 0개");
    expect(screen.getByRole("gridcell", { name: "2026-07-18, 일정 0개, 업무 0개, 스티커 0개" })).toHaveClass("is-today");
  });

  it("shows school, personal, and exercise records in the same date cell", () => {
    render(<FullMonthCalendar month="2026-07" today="2026-07-18" events={[
      { id: "event-school", user_id: "user", title: "방학식", area: "schoolSchedule", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: true, start_time: null, end_time: null, memo: null, description: null, created_at: "", updated_at: "" },
      { id: "event-personal", user_id: "user", title: "병원", area: "personal", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false, start_time: "18:00", end_time: "19:00", memo: null, description: null, created_at: "", updated_at: "" },
    ]} schoolStickers={[
      { id: "sticker", user_id: "user", sticker_key: "vacation-ceremony", sticker_date: "2026-07-18", end_date: null, label: "방학식", note: null, created_at: "", updated_at: "" },
      { id: "personal-sticker", user_id: "user", sticker_key: "personal.hospital", sticker_date: "2026-07-18", end_date: null, label: "병원", note: null, created_at: "", updated_at: "" },
    ]} />);
    const cell = screen.getByRole("gridcell", { name: /2026-07-18, 일정 2개, 업무 0개/ });
    expect(cell).toHaveTextContent("학교");
    expect(cell).toHaveTextContent("개인");
    expect(cell).toHaveTextContent("방학식");
    expect(cell).toHaveTextContent("병원");
  });

  it("opens record-specific sticker management from the sticker instead of the date cell", () => {
    render(<FullMonthCalendar month="2026-07" today="2026-07-18" schoolStickers={[
      { id: "a5000000-0000-4000-8000-000000000003", user_id: "user", sticker_key: "personal.hospital", sticker_date: "2026-07-18", end_date: null, label: "병원", note: null, created_at: "", updated_at: "" },
    ]} />);

    expect(screen.getByRole("button", { name: "7월 18일 병원 스티커 관리" })).toBeInTheDocument();
  });

  it("counts academic sticker overflow inside the unified limit", () => {
    render(<FullMonthCalendar events={[{ id: "event", user_id: "user", title: "교직원 회의", area: "schoolSchedule", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: true, start_time: null, end_time: null, memo: null, description: null, created_at: "", updated_at: "" }]} month="2026-07" schoolStickers={[
      { id: "academic-1", user_id: "user", sticker_key: "academic.admission", sticker_date: "2026-07-18", end_date: null, label: "입학식", note: null, created_at: "", updated_at: "" },
      { id: "academic-2", user_id: "user", sticker_key: "exam-period", sticker_date: "2026-07-18", end_date: null, label: "시험기간", note: null, created_at: "", updated_at: "" },
      { id: "academic-3", user_id: "user", sticker_key: "academic.sports-day", sticker_date: "2026-07-18", end_date: null, label: "체육대회", note: null, created_at: "", updated_at: "" },
    ]} today="2026-07-18" visibleItemLimit={2} />);
    const cell = screen.getByRole("gridcell", { name: /2026-07-18/ });
    expect(cell).toHaveTextContent("입학식");
    expect(cell).toHaveTextContent("교직원 회의");
    expect(cell).toHaveTextContent("+2");
    expect(cell).not.toHaveTextContent("시험기간");
  });

  it("prioritizes registered items and health stickers before lower-priority stickers", () => {
    render(<FullMonthCalendar events={[schoolEvent]} month="2026-07" schoolStickers={[
      { id: "health-1", user_id: "user", sticker_key: "health.student-checkup", sticker_date: "2026-07-18", end_date: null, label: "학생건강검진", note: null, created_at: "", updated_at: "" },
      { id: "academic-1", user_id: "user", sticker_key: "academic.sports-day", sticker_date: "2026-07-18", end_date: null, label: "체육대회", note: null, created_at: "", updated_at: "" },
      { id: "personal-1", user_id: "user", sticker_key: "personal.hospital", sticker_date: "2026-07-18", end_date: null, label: "병원", note: null, created_at: "", updated_at: "" },
    ]} tasks={[healthTask]} today="2026-07-18" visibleItemLimit={4} />);

    const cell = screen.getByRole("gridcell", { name: /2026-07-18, 일정 1개, 업무 1개/ });
    expect(cell).toHaveTextContent("학생건강검진");
    expect(cell).toHaveTextContent("교직원 회의");
    expect(cell).toHaveTextContent("보건일지 정리");
    expect(cell).toHaveTextContent("+1");
    expect(cell).toHaveTextContent("체육대회");
    expect(cell).not.toHaveTextContent("병원");
    expect(screen.getByRole("button", { name: "7월 18일 학생건강검진 스티커 관리" })).toBeInTheDocument();
  });

  it("uses category priority when a mixed date exceeds the visible limit", () => {
    render(<FullMonthCalendar events={[schoolEvent, personalEvent]} month="2026-07" schoolStickers={monthStickerRows} tasks={[healthTask]} today="2026-07-18" visibleItemLimit={4} />);

    const cell = screen.getByRole("gridcell", { name: /2026-07-18, 일정 2개, 업무 1개/ });
    expect(cell).toHaveTextContent("교직원 회의");
    expect(cell).toHaveTextContent("가족 약속");
    expect(cell).toHaveTextContent("보건일지 정리");
    expect(cell).toHaveTextContent("학생건강검진");
    expect(cell).toHaveTextContent("+3");
    expect(cell).not.toHaveTextContent("한글날");
    expect(cell).not.toHaveTextContent("병원");
    expect(cell).not.toHaveTextContent("체육대회");
    expect(screen.getByRole("button", { name: "7월 18일 학생건강검진 스티커 관리" })).toBeInTheDocument();
  });
});
