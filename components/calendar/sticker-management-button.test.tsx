import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StickerManagementButton } from "@/components/calendar/sticker-management-button";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";
import type { EventRow } from "@/types/database";

const mocks = vi.hoisted(() => {
  type RemoveAction = (state: { readonly status: "idle" }, formData: FormData) => Promise<{ readonly status: "success"; readonly message: string }>;
  const removeCalendar = vi.fn<RemoveAction>();
  const removeExercise = vi.fn<RemoveAction>();
  removeCalendar.mockResolvedValue({ status: "success", message: "날짜 스티커를 제거했어요." });
  removeExercise.mockResolvedValue({ status: "success", message: "운동 스티커를 제거했어요." });
  return { refresh: vi.fn(), removeCalendar, removeExercise };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/app/(app)/calendar-sticker-actions", () => ({ removeCalendarStickerAction: mocks.removeCalendar }));
vi.mock("@/app/(app)/exercise-sticker-actions", () => ({ removeExerciseStickerAction: mocks.removeExercise }));
vi.mock("@/app/(app)/work-item-actions", () => ({ deleteWorkItemAction: vi.fn() }));

describe("StickerManagementButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens from a school or personal sticker without activating its date cell and removes only its row id", async () => {
    const selectDate = vi.fn();
    render(<div onClick={selectDate}><span>같은 날짜 일정</span><StickerManagementButton date="2026-07-18" label="병원" recordId="a5000000-0000-4000-8000-000000000003" recordType="calendar"><span>병원 스티커</span></StickerManagementButton><StickerManagementButton date="2026-07-18" label="방학식" recordId="a5000000-0000-4000-8000-000000000004" recordType="calendar"><span>방학식 스티커</span></StickerManagementButton></div>);

    fireEvent.click(screen.getByRole("button", { name: "7월 18일 병원 스티커 관리" }));
    expect(selectDate).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "스티커 관리" })).toHaveTextContent("7월 18일");
    fireEvent.click(screen.getByRole("button", { name: "스티커 제거" }));

    await waitFor(() => expect(mocks.removeCalendar).toHaveBeenCalledTimes(1));
    const formData = mocks.removeCalendar.mock.calls[0]?.[1];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData?.get("stickerId")).toBe("a5000000-0000-4000-8000-000000000003");
    expect(mocks.removeExercise).not.toHaveBeenCalled();
    expect(selectDate).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("button", { name: "7월 18일 병원 스티커 관리" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "7월 18일 방학식 스티커 관리" })).toBeInTheDocument();
    expect(screen.getByText("같은 날짜 일정")).toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("routes an exercise sticker removal through its exercise log id", async () => {
    render(<StickerManagementButton date="2026-07-18" label="배드민턴" recordId="20000000-0000-4000-8000-000000000001" recordType="exercise"><span>배드민턴 스티커</span></StickerManagementButton>);

    fireEvent.click(screen.getByRole("button", { name: "7월 18일 배드민턴 운동 스티커 관리" }));
    fireEvent.click(screen.getByRole("button", { name: "스티커 제거" }));

    await waitFor(() => expect(mocks.removeExercise).toHaveBeenCalledTimes(1));
    const formData = mocks.removeExercise.mock.calls[0]?.[1];
    expect(formData?.get("logId")).toBe("20000000-0000-4000-8000-000000000001");
    expect(mocks.removeCalendar).not.toHaveBeenCalled();
  });

  it("shows an Event time range and opens the existing edit panel", () => {
    const openEdit = vi.fn();
    const event: EventRow = {
      id: "event-sticker",
      user_id: "user",
      title: "온라인 연수 수강",
      area: "schoolSchedule",
      event_type: "school",
      sticker_key: "academic.online-training-study",
      start_date: "2026-07-18",
      end_date: "2026-07-18",
      is_all_day: false,
      start_time: "15:00",
      end_time: "17:00",
      memo: null,
      description: null,
      created_at: "",
      updated_at: "",
    };

    render(<AppShellCreateContext value={{ openCreate: vi.fn(), openEdit }}><StickerManagementButton date="2026-07-18" event={event} label={event.title} recordId={event.id} recordType="event"><span>온라인 연수 수강</span></StickerManagementButton></AppShellCreateContext>);
    fireEvent.click(screen.getByRole("button", { name: "7월 18일 온라인 연수 수강 스티커 관리" }));
    expect(screen.getByRole("dialog", { name: "스티커 관리" })).toHaveTextContent("15:00–17:00");
    fireEvent.click(screen.getByRole("button", { name: "일정 수정" }));
    expect(openEdit).toHaveBeenCalledWith(expect.any(HTMLButtonElement), event);
  });

  it.each([
    [true, null, null, "종일"],
    [false, "14:00", null, "14:00"],
  ] as const)("shows the saved Event time state", (isAllDay, startTime, endTime, expected) => {
    const event: EventRow = {
      id: `event-${expected}`,
      user_id: "user",
      title: "약속",
      area: "personal",
      event_type: "personal",
      sticker_key: "personal.appointment",
      start_date: "2026-07-18",
      end_date: "2026-07-18",
      is_all_day: isAllDay,
      start_time: startTime,
      end_time: endTime,
      memo: null,
      description: null,
      created_at: "",
      updated_at: "",
    };
    render(<AppShellCreateContext value={{ openCreate: vi.fn(), openEdit: vi.fn() }}><StickerManagementButton date="2026-07-18" event={event} label={event.title} recordId={event.id} recordType="event"><span>약속</span></StickerManagementButton></AppShellCreateContext>);
    fireEvent.click(screen.getByRole("button", { name: "7월 18일 약속 스티커 관리" }));
    expect(screen.getByRole("dialog", { name: "스티커 관리" })).toHaveTextContent(expected);
  });
});
