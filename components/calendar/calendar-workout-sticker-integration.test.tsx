import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SchoolStickerPicker } from "@/components/calendar/school-sticker-picker";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";

function renderPicker(openCreate = vi.fn()) {
  render(
    <AppShellCreateContext value={{ openCreate }}>
      <SchoolStickerPicker stickers={[]} today="2026-07-25" />
    </AppShellCreateContext>,
  );
  return openCreate;
}

describe("calendar workout sticker integration", () => {
  it("shows workout and tournament in the real date sticker panel", () => {
    renderPicker();

    const tabs = within(screen.getByRole("tablist", { name: "날짜 스티커 팩" })).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "학교",
      "보건업무",
      "공휴일",
      "개인",
      "운동",
      "대회",
    ]);
  });

  it("opens the shared Event form with workout defaults from a workout sticker", () => {
    const openCreate = renderPicker();

    fireEvent.click(screen.getByRole("tab", { name: "운동" }));
    const badmintonButton = screen.getByRole("button", { name: "배드민턴 운동 일정 만들기" });
    expect(badmintonButton.querySelector('[data-shuttlecock-part="cork"]')).toBeInTheDocument();
    fireEvent.click(badmintonButton);

    expect(openCreate).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement),
      "event",
      expect.objectContaining({
        eventType: "workout",
        workoutType: "배드민턴",
        title: "배드민턴",
        startDate: "2026-07-25",
        endDate: "2026-07-25",
        isAllDay: true,
      }),
    );
  });

  it("opens the shared Event form with tournament defaults", () => {
    const openCreate = renderPicker();

    fireEvent.click(screen.getByRole("tab", { name: "대회" }));
    fireEvent.click(screen.getByRole("button", { name: "대회 일정 만들기" }));

    expect(openCreate).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement),
      "event",
      expect.objectContaining({
        eventType: "tournament",
        startDate: "2026-07-25",
        endDate: "2026-07-25",
        isAllDay: true,
      }),
    );
  });
});
