import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExerciseStickerPicker } from "@/components/exercise/exercise-sticker-picker";
import type { ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/(app)/exercise-sticker-actions", () => ({
  attachExerciseStickerAction: vi.fn(async () => ({ status: "success", message: "배드민턴 스티커를 붙였어요." })),
  removeExerciseStickerAction: vi.fn(async () => ({ status: "success", message: "배드민턴 스티커를 떼었어요." })),
}));

const sticker: ExerciseStickerRow = {
  id: "10000000-0000-4000-8000-000000000001",
  user_id: null,
  label: "배드민턴",
  icon_key: "badminton",
  color_key: "mint",
  display_order: 10,
  is_default: true,
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
};
const log: ExerciseLogRow = { id: "20000000-0000-4000-8000-000000000001", user_id: "user-1", sticker_id: sticker.id, exercise_date: "2026-07-18T00:00:00.000Z", duration_minutes: null, note: null, created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };

afterEach(() => {
  vi.useRealTimers();
  refresh.mockClear();
});

describe("ExerciseStickerPicker", () => {
  it("dismisses a successful sticker message after the feedback interval", async () => {
    vi.useFakeTimers();
    render(<StrictMode><ExerciseStickerPicker date="2026-07-18" logs={[]} stickers={[sticker]} /></StrictMode>);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "2026-07-18에 배드민턴 스티커 붙이기" }));
    });
    expect(screen.getByText("배드민턴 스티커를 붙였어요.")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3200));

    expect(screen.queryByText("배드민턴 스티커를 붙였어요.")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refreshes the client after removing a normalized-date sticker", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    render(<ExerciseStickerPicker date="2026-07-18" logs={[log]} stickers={[sticker]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "배드민턴 스티커 제거" }));
    });

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
