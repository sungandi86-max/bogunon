import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SchoolStickerPicker } from "@/components/calendar/school-sticker-picker";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";
import type { CalendarStickerRow } from "@/types/database";

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

describe("SchoolStickerPicker", () => {
  it("shows school stickers by default and switches to accessible personal sticker tabs", () => {
    render(<AppShellCreateContext value={{ openCreate: vi.fn() }}><SchoolStickerPicker stickers={[]} today="2026-07-18" /></AppShellCreateContext>);

    expect(screen.getByRole("tab", { name: "학교 일정" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "방학식 스티커 붙이기" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "개인 일정" }));
    expect(screen.getByRole("tab", { name: "개인 일정" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "병원 스티커 붙이기" })).toBeInTheDocument();
  });

  it("opens the existing Event form with personal defaults only after user choice", () => {
    const openCreate = vi.fn();
    render(<AppShellCreateContext value={{ openCreate }}><SchoolStickerPicker stickers={[personalSticker]} today="2026-07-18" /></AppShellCreateContext>);
    fireEvent.click(screen.getByRole("tab", { name: "개인 일정" }));
    fireEvent.click(screen.getByRole("button", { name: "개인 일정도 만들기" }));

    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "event", expect.objectContaining({ area: "personal", title: "병원", isAllDay: true }));
  });
});
