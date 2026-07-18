import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExerciseStickerPicker } from "@/components/exercise/exercise-sticker-picker";
import type { ExerciseStickerRow } from "@/types/database";

const mocks = vi.hoisted(() => ({
  attach: vi.fn(async () => ({ status: "success" as const, message: "운동 기록을 저장했어요." })),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/app/(app)/exercise-sticker-actions", () => ({ attachExerciseStickerAction: mocks.attach }));

const sticker: ExerciseStickerRow = {
  id: "10000000-0000-4000-8000-000000000001", user_id: null, label: "배드민턴", icon_key: "badminton", color_key: "mint", display_order: 10, is_default: true,
  created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z",
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("ExerciseStickerPicker", () => {
  it("does not save a selected sticker until the user submits the record", async () => {
    render(<ExerciseStickerPicker date="2026-07-18" logs={[]} stickers={[sticker]} />);

    fireEvent.click(screen.getByRole("button", { name: "배드민턴 선택" }));
    expect(mocks.attach).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));

    expect(mocks.attach).toHaveBeenCalledOnce();
  });

  it("dismisses successful feedback and refreshes the current view", async () => {
    vi.useFakeTimers();
    render(<StrictMode><ExerciseStickerPicker date="2026-07-18" logs={[]} stickers={[sticker]} /></StrictMode>);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));
    expect(screen.getByText("운동 기록을 저장했어요.")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3200));

    expect(screen.queryByText("운동 기록을 저장했어요.")).not.toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
