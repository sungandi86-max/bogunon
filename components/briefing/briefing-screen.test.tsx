import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BriefingScreen } from "@/components/briefing/briefing-screen";
import { AppShell } from "@/components/layout/app-shell";
import type { EventRow, ExerciseLogRow, ExerciseStickerRow, TaskRow } from "@/types/database";

vi.mock("next/navigation", () => ({
  usePathname: () => "/briefing",
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("BriefingScreen", () => {
  it("renders the operations dashboard and opens quick create", () => {
    render(
      <AppShell>
        <BriefingScreen events={[]} month="2026-07" tasks={[]} today="2026-07-17" />
      </AppShell>,
    );

    expect(document.querySelector(".operations-dashboard")).toBeInTheDocument();
    expect(document.querySelector(".operations-main")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "오늘의 운영 항목" })).toHaveClass("operations-rail");
    expect(screen.getByRole("grid", { name: "2026년 7월 월간 캘린더" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "오늘 요약" })).toBeInTheDocument();
    expect(screen.getAllByText("오늘 할 일").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("진행 중 업무 절차")).toBeInTheDocument();
    expect(screen.getByText(/오늘 일정 0건/)).toBeInTheDocument();
    expect(screen.queryByText("저장 완료")).not.toBeInTheDocument();
    expect(screen.queryByText("동기화 완료")).not.toBeInTheDocument();
    expect(screen.queryByText("Supabase 저장")).not.toBeInTheDocument();
    expect(screen.queryByText("업무 운영 중")).not.toBeInTheDocument();
    expect(screen.getByText("예정된 다음 일정이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("오늘 등록된 일정이 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "모바일 주요 메뉴" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "업무 메모" }));
    expect(screen.getByRole("dialog", { name: "새로 만들기" })).toBeInTheDocument();
  });

  it("shows today's task, schedule, deadline, and waiting details from actual rows", () => {
    const task: TaskRow = {
      id: "task-1", user_id: "user-1", title: "약품 점검", area: "healthWork",
      status: "waitingForReply", priority: "high", category: "medication",
      scheduled_date: "2026-07-17", due_date: "2026-07-17", follow_up_date: "2026-07-18",
      memo: null, description: null, estimated_minutes: null, completed_at: null, recurrence_frequency: "monthly",
      recurrence_source_id: null, recurrence_date: "2026-07-17",
      recurrence_generated_through: "2026-07-17",
      created_at: "2026-07-17T00:00:00Z", updated_at: "2026-07-17T00:00:00Z",
    };
    const event: EventRow = {
      id: "event-1", user_id: "user-1", title: "학생건강검진", area: "healthWork",
      start_date: "2026-07-17", end_date: "2026-07-17", is_all_day: false,
      start_time: "09:00:00", end_time: null, memo: "홈에서는 숨기는 일정 설명", description: null,
      created_at: "2026-07-17T00:00:00Z", updated_at: "2026-07-17T00:00:00Z",
    };

    render(<AppShell><BriefingScreen events={[event]} month="2026-07" tasks={[task]} today="2026-07-17" /></AppShell>);

    expect(screen.getByRole("heading", { name: "오늘 해야 할 일" })).toBeInTheDocument();
    expect(screen.getAllByText("약품 점검").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("오늘 1건")).toBeInTheDocument();
    expect(screen.getAllByText("09:00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("학생건강검진").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("가장 가까운 일정")).not.toBeInTheDocument();
    expect(screen.queryByText("홈에서는 숨기는 일정 설명")).not.toBeInTheDocument();
  });

  it("uses the same normalized exercise date source as the monthly calendar", () => {
    const sticker: ExerciseStickerRow = { id: "10000000-0000-4000-8000-000000000001", user_id: null, label: "배드민턴", icon_key: "badminton", color_key: "mint", display_order: 10, is_default: true, created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };
    const exerciseLog: ExerciseLogRow = { id: "20000000-0000-4000-8000-000000000001", user_id: "user-1", sticker_id: sticker.id, exercise_date: "2026-07-18T00:00:00.000Z", duration_minutes: null, note: null, created_at: "2026-07-18T00:00:00Z", updated_at: "2026-07-18T00:00:00Z" };

    render(<AppShell><BriefingScreen events={[]} exerciseLogs={[exerciseLog]} exerciseStickers={[sticker]} month="2026-07" tasks={[]} today="2026-07-18" /></AppShell>);

    expect(screen.getByText("배드민턴 했다!")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "배드민턴 운동 스티커, 완료" })).toBeInTheDocument();
  });
});
