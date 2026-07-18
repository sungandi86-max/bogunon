import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExerciseWorkspace } from "@/components/exercise/exercise-workspace";
import { serializeExerciseMetadata } from "@/lib/exercise/domain";
import type { EventRow, ExerciseLogRow, ExerciseStickerRow } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(app)/exercise-sticker-actions", () => ({
  attachExerciseStickerAction: vi.fn(async () => ({ status: "success", message: "운동 스티커를 붙였어요." })),
  removeExerciseStickerAction: vi.fn(async () => ({ status: "success", message: "운동 스티커를 떼었어요." })),
  updateExerciseStickerDetailsAction: vi.fn(async () => ({ status: "success", message: "운동 기록을 저장했어요." })),
  saveCustomExerciseStickerAction: vi.fn(async () => ({ status: "success", message: "내 스티커를 만들었어요." })),
  removeCustomExerciseStickerAction: vi.fn(async () => ({ status: "success", message: "내 스티커를 삭제했어요." })),
}));

const sticker: ExerciseStickerRow = { id: "10000000-0000-4000-8000-000000000001", user_id: null, label: "배드민턴", icon_key: "badminton", color_key: "mint", display_order: 10, is_default: true, created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };
const log: ExerciseLogRow = { id: "20000000-0000-4000-8000-000000000001", user_id: "user-1", sticker_id: sticker.id, exercise_date: "2026-07-18", duration_minutes: null, note: null, created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };
const event: EventRow = { id: "event-1", user_id: "user-1", title: "배드민턴", area: "exercise", start_date: "2026-07-18", end_date: "2026-07-18", is_all_day: false, start_time: "19:00:00", end_time: "20:30:00", memo: "[QA-EX] 운동 전용 폼 저장 및 새로고침 검증", description: serializeExerciseMetadata({ durationMinutes: 90, intensity: "moderate", location: "학교 체육관", recurrence: "weekly", status: "planned" }), created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };

describe("ExerciseWorkspace", () => {
  it("opens the instant sticker picker from the navigation route", () => {
    render(<ExerciseWorkspace events={[]} initialOpen logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    expect(screen.getByRole("dialog", { name: "오늘 운동했나요?" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "2026-07-18에 배드민턴 스티커 붙이기" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByLabelText("강도")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("장소")).not.toBeInTheDocument();
  });

  it("opens the same sticker picker from the page action", () => {
    render(<ExerciseWorkspace events={[]} logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    fireEvent.click(screen.getByRole("button", { name: "운동 스티커 붙이기" }));
    expect(screen.getByRole("dialog", { name: "오늘 운동했나요?" })).toBeInTheDocument();
  });

  it("renders saved stickers on the calendar and keeps optional details behind the record", () => {
    render(<ExerciseWorkspace events={[]} logs={[log]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    const calendarDay = screen.getByRole("button", { name: /18.*배드민턴 운동 스티커/ });
    expect(within(calendarDay).getByRole("img", { name: "배드민턴 운동 스티커" })).toHaveClass("exercise-sticker--sm");
    expect(screen.getByText("배드민턴 했다!")).toBeInTheDocument();
    expect(screen.getByText("이번 달 운동 1일 · 연속 1일")).toBeInTheDocument();
  });

  it("keeps the selected-date panel inside the visible month after month navigation", () => {
    const { rerender } = render(<ExerciseWorkspace events={[]} logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    fireEvent.click(screen.getByRole("button", { name: "19" }));
    rerender(<ExerciseWorkspace events={[]} logs={[]} month="2026-08" stickers={[sticker]} today="2026-07-18" />);
    expect(screen.getByRole("heading", { name: "2026. 08. 01" })).toBeInTheDocument();
  });

  it("preserves legacy event-based exercise records in a separate section", () => {
    render(<ExerciseWorkspace events={[event]} logs={[]} month="2026-07" stickers={[sticker]} today="2026-07-18" />);
    expect(screen.getByRole("heading", { name: "기존 운동 일정" })).toBeInTheDocument();
    expect(screen.getByText("[QA-EX] 운동 전용 폼 저장 및 새로고침 검증")).toBeInTheDocument();
  });
});
