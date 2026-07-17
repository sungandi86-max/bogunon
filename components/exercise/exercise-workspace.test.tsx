import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExerciseWorkspace } from "@/components/exercise/exercise-workspace";
import { serializeExerciseMetadata } from "@/lib/exercise/domain";
import type { EventRow } from "@/types/database";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(app)/exercise-actions", () => ({
  saveExerciseAction: vi.fn(async () => ({ status: "success", message: "운동 기록을 저장했습니다." })),
  setExerciseStatusAction: vi.fn(),
}));

const event = (id: string, status: "planned" | "completed" | "cancelled"): EventRow => ({
  id,
  user_id: "user-1",
  title: "배드민턴",
  area: "exercise",
  start_date: "2026-07-18",
  end_date: "2026-07-18",
  is_all_day: false,
  start_time: "19:00:00",
  end_time: "20:30:00",
  memo: "체육관 앞에서 만나기",
  description: serializeExerciseMetadata({ durationMinutes: 90, intensity: "moderate", location: "학교 체육관", recurrence: "weekly", status }),
  created_at: "2026-07-18T00:00:00.000Z",
  updated_at: "2026-07-18T00:00:00.000Z",
});

describe("ExerciseWorkspace", () => {
  it("opens a contextual exercise form without generic work fields", () => {
    render(<ExerciseWorkspace events={[]} today="2026-07-18" />);
    fireEvent.click(screen.getByRole("button", { name: "운동 기록 추가" }));

    expect(screen.getByRole("dialog", { name: "운동 기록 추가" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "운동 종류" })).toBeInTheDocument();
    expect(screen.getByLabelText("운동 시간(분)")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "강도" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "항목 종류" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "업무 카테고리" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "우선순위" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /AI/ })).not.toBeInTheDocument();
  });

  it("fills exercise fields from Korean quick input", () => {
    render(<ExerciseWorkspace events={[]} today="2026-07-18" />);
    fireEvent.click(screen.getByRole("button", { name: "운동 기록 추가" }));
    fireEvent.change(screen.getByPlaceholderText("예: 오늘 저녁 7시 배드민턴 2시간"), { target: { value: "오늘 저녁 7시 배드민턴 2시간" } });
    fireEvent.click(screen.getByRole("button", { name: "입력 해석" }));

    expect(screen.getByRole("combobox", { name: "운동 종류" })).toHaveValue("badminton");
    expect(screen.getByLabelText("날짜")).toHaveValue("2026-07-18");
    expect(screen.getByLabelText("시작 시간")).toHaveValue("19:00");
    expect(screen.getByLabelText("운동 시간(분)")).toHaveValue(120);
  });

  it("separates planned exercise from completed and cancelled history", () => {
    render(<ExerciseWorkspace events={[event("planned", "planned"), event("completed", "completed"), event("cancelled", "cancelled")]} today="2026-07-18" />);

    expect(screen.getByRole("heading", { name: "예정된 운동" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "완료·취소 기록" })).toBeInTheDocument();
    expect(screen.getByText("예정")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
    expect(screen.getByText("취소")).toBeInTheDocument();
    expect(screen.getAllByText("매주 반복")).toHaveLength(3);
  });
});
