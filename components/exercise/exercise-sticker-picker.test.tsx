import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExerciseStickerPicker } from "@/components/exercise/exercise-sticker-picker";
import type { EventRow, ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

const mocks = vi.hoisted(() => ({
  attach: vi.fn<(
    state: import("@/app/(app)/exercise-sticker-actions").ExerciseCreateActionState,
    formData: FormData,
  ) => Promise<import("@/app/(app)/exercise-sticker-actions").ExerciseCreateActionState>>()
    .mockResolvedValue({ status: "success", outcome: "created", message: "운동 기록을 저장했어요.", logId: "20000000-0000-4000-8000-000000000001", recordType: "exercise" }),
  update: vi.fn<(
    state: import("@/app/(app)/exercise-sticker-actions").StickerActionState,
    formData: FormData,
  ) => Promise<import("@/app/(app)/exercise-sticker-actions").StickerActionState>>()
    .mockResolvedValue({ status: "success", message: "운동 기록을 저장했어요." }),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("@/app/(app)/exercise-sticker-actions", () => ({
  attachExerciseStickerAction: mocks.attach,
  updateExerciseStickerDetailsAction: mocks.update,
}));

const sticker: ExerciseStickerRow = {
  id: "10000000-0000-4000-8000-000000000001", user_id: null, label: "배드민턴", icon_key: "badminton", color_key: "mint", display_order: 10, is_default: true,
  created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z",
};
const runningSticker: ExerciseStickerRow = { ...sticker, id: "10000000-0000-4000-8000-000000000002", label: "러닝", icon_key: "running", display_order: 20 };
const pilatesSticker: ExerciseStickerRow = { ...sticker, id: "10000000-0000-4000-8000-000000000010", label: "필라테스", icon_key: "pilates", color_key: "pink", display_order: 90 };
const legacyLessonSticker: ExerciseStickerRow = { ...sticker, id: "10000000-0000-4000-8000-000000000006", label: "legacy lesson", icon_key: "badminton_lesson", display_order: 15 };
const lessonLog: ExerciseLogRow = { id: "20000000-0000-4000-8000-000000000003", user_id: "user-1", sticker_id: sticker.id, exercise_date: "2026-07-18", duration_minutes: null, note: null, record_type: "lesson", created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };
const runningLessonLog: ExerciseLogRow = { ...lessonLog, id: "20000000-0000-4000-8000-000000000004", sticker_id: runningSticker.id };
const workoutEvent: EventRow = {
  id: "30000000-0000-4000-8000-000000000001",
  user_id: "user-1",
  title: "배드민턴 레슨",
  area: "exercise",
  event_type: "workout",
  event_details: { kind: "workout", workoutType: "배드민턴" },
  start_date: "2026-07-31",
  end_date: "2026-07-31",
  is_all_day: false,
  start_time: "19:40:00",
  end_time: "21:10:00",
  location: "체육관",
  memo: null,
  description: null,
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  mocks.attach.mockResolvedValue({ status: "success", outcome: "created", message: "운동 기록을 저장했어요.", logId: "20000000-0000-4000-8000-000000000001", recordType: "exercise" });
  mocks.update.mockResolvedValue({ status: "success", message: "운동 기록을 저장했어요." });
});

describe("ExerciseStickerPicker", () => {
  it("prefills a linked workout in a compact form and calculates its duration", () => {
    const { container } = render(
      <ExerciseStickerPicker
        date="2026-07-31"
        event={workoutEvent}
        logs={[]}
        stickers={[sticker, runningSticker]}
      />,
    );

    expect(screen.getByRole("heading", { name: "배드민턴 레슨" })).toBeInTheDocument();
    expect(screen.getByText("2026.07.31 · 19:40 ~ 21:10")).toBeInTheDocument();
    expect(screen.getByLabelText("운동 종류")).toHaveValue(sticker.id);
    expect(screen.getByLabelText("운동 시간(분)")).toHaveValue(90);
    expect(container.querySelector<HTMLInputElement>('input[name="eventId"]')).toHaveValue(workoutEvent.id);
    expect(screen.queryByRole("radiogroup", { name: "기록 유형" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("운동 강도")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("컨디션")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("칼로리")).not.toBeInTheDocument();
  });

  it("supports quick and direct duration input without requiring a memo", async () => {
    render(
      <ExerciseStickerPicker
        date="2026-07-31"
        event={workoutEvent}
        logs={[]}
        stickers={[sticker]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "60분" }));
    expect(screen.getByLabelText("운동 시간(분)")).toHaveValue(60);
    fireEvent.change(screen.getByLabelText("운동 시간(분)"), { target: { value: "75" } });
    expect(screen.getByLabelText("운동 시간(분)")).toHaveValue(75);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "운동 기록 저장" })));

    const submitted = mocks.attach.mock.calls.at(-1)?.[1];
    expect(submitted).toBeInstanceOf(FormData);
    expect((submitted as FormData).get("durationMinutes")).toBe("75");
    expect((submitted as FormData).get("note")).toBe("");
  });

  it("does not guess duration for an all-day or start-only schedule", () => {
    const { unmount } = render(
      <ExerciseStickerPicker
        date="2026-07-31"
        event={{ ...workoutEvent, end_time: null }}
        logs={[]}
        stickers={[sticker]}
      />,
    );

    expect(screen.getByLabelText("운동 시간(분)")).toHaveValue(null);
    expect(screen.getByRole("button", { name: "운동 기록 저장" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "30분" }));
    expect(screen.getByRole("button", { name: "운동 기록 저장" })).toBeEnabled();

    unmount();
    render(
      <ExerciseStickerPicker
        date="2026-07-31"
        event={{ ...workoutEvent, is_all_day: true, start_time: null, end_time: null }}
        logs={[]}
        stickers={[sticker]}
      />,
    );
    expect(screen.getByLabelText("운동 시간(분)")).toHaveValue(null);
  });

  it("loads and updates the existing event-linked record without changing its event id", async () => {
    const existingLog: ExerciseLogRow = {
      ...lessonLog,
      id: "20000000-0000-4000-8000-000000000010",
      event_id: workoutEvent.id,
      duration_minutes: 80,
      note: "게임 4세트",
      record_type: "exercise",
    };
    const { container } = render(
      <ExerciseStickerPicker
        date="2026-07-31"
        event={workoutEvent}
        existingLog={existingLog}
        logs={[existingLog]}
        stickers={[sticker]}
      />,
    );

    expect(screen.getByLabelText("운동 시간(분)")).toHaveValue(80);
    expect(screen.getByLabelText("메모(선택)")).toHaveValue("게임 4세트");
    expect(container.querySelector<HTMLInputElement>('input[name="eventId"]')).toHaveValue(workoutEvent.id);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "수정 저장" })));
    expect(mocks.update).toHaveBeenCalledOnce();
    const submitted = mocks.update.mock.calls.at(-1)?.[1];
    expect((submitted as FormData).get("logId")).toBe(existingLog.id);
    expect((submitted as FormData).get("stickerId")).toBe(sticker.id);
  });

  it("keeps tournament entries in the existing competition review flow", () => {
    render(
      <ExerciseStickerPicker
        date="2026-07-31"
        event={{ ...workoutEvent, event_type: "tournament", event_details: null }}
        eventId={workoutEvent.id}
        initialRecordType="competition"
        logs={[]}
        stickers={[sticker]}
      />,
    );

    expect(screen.queryByText("연결된 운동 일정")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /배드민턴 선택/ })).toBeInTheDocument();
  });

  it("selects Pilates for today's record and marks an existing Pilates completion", () => {
    const pilatesLog: ExerciseLogRow = { ...lessonLog, id: "20000000-0000-4000-8000-000000000010", sticker_id: pilatesSticker.id, record_type: "exercise" };
    const { container, rerender } = render(<ExerciseStickerPicker date="2026-07-18" logs={[]} stickers={[sticker, pilatesSticker]} />);

    fireEvent.click(screen.getByRole("button", { name: "필라테스 선택" }));
    expect(container.querySelector<HTMLInputElement>('input[name="stickerId"]')).toHaveValue(pilatesSticker.id);

    rerender(<ExerciseStickerPicker date="2026-07-18" logs={[pilatesLog]} stickers={[sticker, pilatesSticker]} />);
    expect(screen.getByRole("button", { name: "필라테스 선택, 이미 기록됨" })).toBeDisabled();
    expect(screen.getByRole("img", { name: "필라테스 운동 스티커, 비활성" })).toBeInTheDocument();
  });

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
