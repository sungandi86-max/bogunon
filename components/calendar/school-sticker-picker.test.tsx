import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SchoolStickerPicker } from "@/components/calendar/school-sticker-picker";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";
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
  it("shows responsive school, academic, and personal pack tabs", () => {
    renderPicker();
    expect(screen.getByRole("tab", { name: "학교" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "학사일정" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "개인" })).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "여름방학 스티커 저장" })).toBeEnabled();
    fireEvent.change(search, { target: { value: "시험" } });
    expect(screen.getByRole("button", { name: "스티커를 선택해 주세요" })).toBeDisabled();
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
    fireEvent.click(screen.getByRole("button", { name: "입학식 스티커 저장" }));
    await waitFor(() => expect(actions.attach).toHaveBeenCalledTimes(1));
    const formData = actions.attach.mock.calls[0]?.[1];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData?.get("stickerKey")).toBe("academic.admission");
  });

  it("opens the existing Event form with personal defaults only after user choice", () => {
    const openCreate = vi.fn();
    render(<AppShellCreateContext value={{ openCreate }}><SchoolStickerPicker stickers={[personalSticker]} today="2026-07-18" /></AppShellCreateContext>);
    fireEvent.click(screen.getByRole("tab", { name: "개인" }));
    fireEvent.click(screen.getByRole("button", { name: "개인 일정도 만들기" }));
    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "event", expect.objectContaining({ area: "personal", title: "병원", isAllDay: true }));
  });
});
