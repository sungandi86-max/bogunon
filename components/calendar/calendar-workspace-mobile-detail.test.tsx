import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CalendarWorkspace, mobileDateTitle } from "@/components/calendar/calendar-workspace";
import type { CalendarStickerRow, EventRow, TaskRow } from "@/types/database";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace }),
  useSearchParams: () => new URLSearchParams("date=2026-09-01&view=month"),
}));
vi.mock("@/app/(app)/calendar-event-actions", () => ({
  copyEventAction: vi.fn(),
  moveSingleDayEventAction: vi.fn(),
}));
vi.mock("@/app/(app)/work-item-actions", () => ({
  deleteWorkItemAction: vi.fn(),
  duplicateWorkItemAction: vi.fn(),
  moveCalendarItemAction: vi.fn(),
  saveWorkItemAction: vi.fn(),
  saveWorkItemAsTemplateAction: vi.fn(),
}));

const workflow = { templates: [], templateChecklistItems: [], checklistItems: [], taskLinks: [], eventLinks: [], taskReminders: [], eventReminders: [] };
const event: EventRow = { id: "event-1", user_id: "user", title: "보건교육", area: "healthWork", start_date: "2026-09-08", end_date: "2026-09-08", is_all_day: false, start_time: "14:00:00", end_time: "15:00:00", location: "시청각실", memo: null, description: null, created_at: "", updated_at: "" };
const task: TaskRow = { id: "task-1", user_id: "user", title: "건강상담 기록 정리", area: "healthWork", status: "planned", priority: "normal", category: "officialDocument", scheduled_date: "2026-09-08", due_date: null, follow_up_date: null, memo: null, description: null, estimated_minutes: null, completed_at: null, recurrence_frequency: null, recurrence_source_id: null, recurrence_date: null, recurrence_generated_through: null, created_at: "", updated_at: "" };

function renderWorkspace(events: readonly EventRow[] = [], stickers: readonly CalendarStickerRow[] = [], tasks: readonly TaskRow[] = []): void {
  render(<CalendarWorkspace events={[...events]} initialDate="2026-09-01" initialView="month" stickers={[...stickers]} tasks={[...tasks]} today="2026-09-01" workflow={workflow} />);
}

describe("CalendarWorkspace mobile date detail", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn((query: string) => ({ matches: query === "(max-width: 767px)" })),
    });
    replace.mockClear();
    refresh.mockClear();
  });

  it("uses a deterministic title when the selected date is malformed", () => {
    expect(mobileDateTitle("2026-99-99")).toBe("선택한 날짜");
  });

  it("opens the selected mobile month date in a titled detail sheet with populated content", () => {
    const septemberEvent: EventRow = { ...event, title: "안전교육", location: "보건실" };
    const stickers: CalendarStickerRow[] = [{
      id: "sticker-1",
      user_id: "user",
      sticker_key: "health.student-checkup",
      sticker_date: "2026-09-08",
      end_date: null,
      label: "학생건강검진",
      note: null,
      created_at: "",
      updated_at: "",
    }];
    renderWorkspace([septemberEvent], stickers, [task]);

    fireEvent.click(screen.getByRole("button", { name: "2026-09-08 선택" }));

    const detailSheet = screen.getByRole("dialog", { name: "9월 8일 화요일" });
    expect(detailSheet).toHaveTextContent("14:00 ~ 15:00");
    expect(detailSheet).toHaveTextContent("안전교육");
    expect(within(detailSheet).getByText("업무", { selector: ".event-area-badge" })).toBeInTheDocument();
    expect(within(detailSheet).getByText("건강상담 기록 정리", { selector: "strong" })).toBeInTheDocument();
    expect(within(detailSheet).getByRole("region", { name: "2026-09-08 업무" })).toHaveClass("calendar-mobile-date-detail__tasks");
    expect(detailSheet).toHaveTextContent("장소 · 보건실");
    expect(within(detailSheet).getByLabelText("학생건강검진")).toBeInTheDocument();
  });

  it("keeps nested event actions out of the mobile date sheet", () => {
    renderWorkspace([event]);

    fireEvent.click(screen.getByRole("button", { name: "2026-09-08 선택" }));

    const detailSheet = screen.getByRole("dialog", { name: "9월 8일 화요일" });
    expect(within(detailSheet).queryByRole("button", { name: "편집" })).not.toBeInTheDocument();
    expect(within(detailSheet).queryByRole("button", { name: "복사" })).not.toBeInTheDocument();
    expect(within(detailSheet).queryByRole("button", { name: "템플릿으로 저장" })).not.toBeInTheDocument();
    expect(within(detailSheet).queryByRole("button", { name: "삭제" })).not.toBeInTheDocument();
  });

  it("shows the exact empty message in an empty mobile date sheet", () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "2026-09-08 선택" }));

    expect(screen.getByRole("dialog", { name: "9월 8일 화요일" })).toHaveTextContent("아직 등록된 일정이 없어요");
  });

  it("hands the selected mobile date to the existing event create form", () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "2026-09-08 선택" }));

    fireEvent.click(within(screen.getByRole("dialog", { name: "9월 8일 화요일" })).getByRole("button", { name: "이 날 일정 추가하기" }));

    const createSheet = screen.getByRole("dialog", { name: "시간 일정 추가" });
    expect(within(createSheet).getByLabelText("시작일")).toHaveValue("2026-09-08");
    expect(within(createSheet).getByLabelText("종료일")).toHaveValue("2026-09-08");
  });

  it("closes the mobile date sheet without removing the calendar or its one-plus-overflow summary", () => {
    const events: EventRow[] = [
      { ...event, title: "첫 일정" },
      { ...event, id: "event-2", title: "둘째 일정" },
      { ...event, id: "event-3", title: "셋째 일정" },
    ];
    renderWorkspace(events);
    const cell = screen.getByRole("gridcell", { name: /2026-09-08/ });
    expect(cell.querySelector(".full-calendar__mobile-summary")).toHaveTextContent("첫 일정+2");

    fireEvent.click(screen.getByRole("button", { name: "2026-09-08 선택" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "9월 8일 화요일" })).getByRole("button", { name: "패널 닫기" }));

    expect(screen.queryByRole("dialog", { name: "9월 8일 화요일" })).toBeNull();
    expect(screen.getByRole("grid", { name: "2026년 9월 월간 캘린더" })).toBeInTheDocument();
    expect(cell.querySelector(".full-calendar__mobile-summary")).toHaveTextContent("첫 일정+2");
  });

  it("restores the selected date trigger after the full overlay pointer sequence", async () => {
    renderWorkspace();
    const dateTrigger = screen.getByRole("button", { name: "2026-09-08 선택" });
    dateTrigger.focus();
    fireEvent.click(dateTrigger);

    const overlay = screen.getByRole("presentation");
    fireEvent.mouseDown(overlay);
    fireEvent.mouseUp(document.body);
    dateTrigger.blur();
    fireEvent.click(document.body);

    await waitFor(() => expect(dateTrigger).toHaveFocus());
  });

  it("keeps desktop month date selection in the existing detail column without a drawer", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    renderWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "2026-09-08 선택" }));

    expect(screen.queryByRole("dialog", { name: "9월 8일 화요일" })).toBeNull();
    expect(screen.getByRole("complementary", { name: "2026-09-08 선택 날짜 상세" })).toBeInTheDocument();
  });
});
