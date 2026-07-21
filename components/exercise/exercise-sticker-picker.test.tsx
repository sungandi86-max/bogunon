import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExerciseStickerPicker } from "@/components/exercise/exercise-sticker-picker";
import type { ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

const mocks = vi.hoisted(() => ({
  attach: vi.fn(async (): Promise<import("@/app/(app)/exercise-sticker-actions").ExerciseCreateActionState> => ({ status: "success", outcome: "created", message: "운동 기록을 저장했어요.", logId: "20000000-0000-4000-8000-000000000001", recordType: "exercise" })),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/app/(app)/exercise-sticker-actions", () => ({ attachExerciseStickerAction: mocks.attach }));

const sticker: ExerciseStickerRow = {
  id: "10000000-0000-4000-8000-000000000001", user_id: null, label: "배드민턴", icon_key: "badminton", color_key: "mint", display_order: 10, is_default: true,
  created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z",
};
const runningSticker: ExerciseStickerRow = { ...sticker, id: "10000000-0000-4000-8000-000000000002", label: "러닝", icon_key: "running", display_order: 20 };
const legacyLessonSticker: ExerciseStickerRow = { ...sticker, id: "10000000-0000-4000-8000-000000000006", label: "legacy lesson", icon_key: "badminton_lesson", display_order: 15 };
const lessonLog: ExerciseLogRow = { id: "20000000-0000-4000-8000-000000000003", user_id: "user-1", sticker_id: sticker.id, exercise_date: "2026-07-18", duration_minutes: null, note: null, record_type: "lesson", created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };
const runningLessonLog: ExerciseLogRow = { ...lessonLog, id: "20000000-0000-4000-8000-000000000004", sticker_id: runningSticker.id };

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  mocks.attach.mockResolvedValue({ status: "success", outcome: "created", message: "운동 기록을 저장했어요.", logId: "20000000-0000-4000-8000-000000000001", recordType: "exercise" });
});

describe("ExerciseStickerPicker", () => {
  it("excludes the legacy badminton lesson sticker from new record choices", () => {
    const { container } = render(<ExerciseStickerPicker date="2026-07-18" logs={[]} stickers={[legacyLessonSticker, sticker]} />);

    expect(screen.queryByText("legacy lesson")).not.toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>('input[name="stickerId"]')).toHaveValue(sticker.id);
  });

  it("does not save a selected sticker until the user submits the record", async () => {
    render(<ExerciseStickerPicker date="2026-07-18" logs={[]} stickers={[sticker]} />);

    fireEvent.click(screen.getByRole("button", { name: "배드민턴 선택" }));
    expect(mocks.attach).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));

    expect(mocks.attach).toHaveBeenCalledOnce();
  });

  it("keeps quick exercise input minimal and exposes a separate record type choice", () => {
    render(<ExerciseStickerPicker date="2026-07-18" logs={[]} stickers={[sticker]} />);

    expect(screen.getByRole("radiogroup", { name: "기록 유형" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "일반 운동" })).toBeChecked();
    expect(screen.queryByLabelText("운동 완료")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("운동 시간(선택)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("메모(선택)")).toBeInTheDocument();
  });

  it("returns the created lesson log to its caller but not duplicate or failed outcomes", async () => {
    const onCreated = vi.fn();
    mocks.attach.mockResolvedValueOnce({ status: "success", outcome: "created", message: "저장", logId: "20000000-0000-4000-8000-000000000002", recordType: "lesson" });
    const { rerender } = render(<ExerciseStickerPicker date="2026-07-18" logs={[]} onCreated={onCreated} stickers={[sticker]} />);
    fireEvent.click(screen.getByRole("radio", { name: "레슨" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));
    expect(onCreated).toHaveBeenCalledWith({ logId: "20000000-0000-4000-8000-000000000002", recordType: "lesson" });

    mocks.attach.mockResolvedValueOnce({ status: "success", outcome: "duplicate", message: "이미 기록됨" });
    rerender(<ExerciseStickerPicker date="2026-07-18" logs={[]} onCreated={onCreated} stickers={[sticker]} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  it("moves selection away from a sticker already recorded in the newly selected type", () => {
    render(<ExerciseStickerPicker date="2026-07-18" logs={[lessonLog]} stickers={[sticker, runningSticker]} />);
    expect(screen.getByRole("button", { name: "배드민턴 선택" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("radio", { name: "레슨" }));
    expect(screen.getByRole("button", { name: "배드민턴 선택, 이미 기록됨" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "러닝 선택" })).toHaveAttribute("aria-pressed", "true");
  });

  it("clears selection and disables save when the selected type has no available sticker", () => {
    render(<ExerciseStickerPicker date="2026-07-18" logs={[lessonLog, runningLessonLog]} stickers={[sticker, runningSticker]} />);
    fireEvent.click(screen.getByRole("radio", { name: "레슨" }));
    expect(screen.getByRole("button", { name: "운동 기록 저장" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "배드민턴 선택, 이미 기록됨" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "러닝 선택, 이미 기록됨" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reconciles the hidden selection when refreshed logs consume the current sticker", () => {
    const exerciseLog: ExerciseLogRow = { ...lessonLog, id: "20000000-0000-4000-8000-000000000005", record_type: "exercise" };
    const { container, rerender } = render(<ExerciseStickerPicker date="2026-07-18" logs={[]} stickers={[sticker]} />);
    const hiddenSelection = container.querySelector<HTMLInputElement>('input[name="stickerId"]');
    expect(hiddenSelection).toHaveValue(sticker.id);

    rerender(<ExerciseStickerPicker date="2026-07-18" logs={[exerciseLog]} stickers={[sticker]} />);
    expect(hiddenSelection).toHaveValue("");
    expect(screen.getByRole("button", { name: "운동 기록 저장" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "배드민턴 선택, 이미 기록됨" })).toHaveAttribute("aria-pressed", "false");
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
