import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventCopyMenu } from "@/components/calendar/event-copy-menu";

const copyEventAction = vi.fn(async (
  state: unknown,
  formData: FormData,
): Promise<{ status: "success" | "error"; message: string; targetDate?: string }> => {
  void state;
  void formData;
  return {
    status: "success",
    message: "일정이 7월 29일로 복사되었습니다.",
    targetDate: "2026-07-29",
  };
});

vi.mock("@/app/(app)/calendar-event-actions", () => ({
  copyEventAction: (state: unknown, formData: FormData) => copyEventAction(state, formData),
}));

describe("EventCopyMenu", () => {
  it("offers same-day, next-day, next-week, and direct-date copy choices", () => {
    render(<EventCopyMenu eventId="event-1" startDate="2026-07-22" />);
    fireEvent.click(screen.getByRole("button", { name: "복사" }));

    expect(screen.getByRole("dialog", { name: "일정 복사" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "같은 날짜에 복사" }).getAttribute("value")).toBe("2026-07-22");
    expect(screen.getByRole("button", { name: "다음 날로 복사" }).getAttribute("value")).toBe("2026-07-23");
    expect(screen.getByRole("button", { name: "다음 주 같은 요일로 복사" }).getAttribute("value")).toBe("2026-07-29");
    expect(screen.getByLabelText("복사할 날짜 직접 선택")).toBeTruthy();
  });

  it("submits a directly selected date", () => {
    render(<EventCopyMenu eventId="event-1" startDate="2026-07-22" />);
    fireEvent.click(screen.getByRole("button", { name: "복사" }));
    fireEvent.click(screen.getByLabelText("복사할 날짜 직접 선택"));
    const dialog = screen.getByRole("dialog", { name: "날짜 선택" });
    fireEvent.click(within(dialog).getByRole("button", { name: "다음 달" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "3" }));
    expect(screen.getByRole("button", { name: "선택한 날짜로 복사" }).getAttribute("value")).toBe("2026-08-03");
  });
});
