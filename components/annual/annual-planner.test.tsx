import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnnualPlanner } from "@/components/annual/annual-planner";
import { HealthPresetPreferencesProvider } from "@/components/health-presets/health-preset-preferences-context";
import { AppShellCreateContext } from "@/components/layout/app-shell-create-context";
import { defaultHealthPresetPreferences } from "@/lib/work-items/health-preset-personalization";
import type { HealthPresetPreference } from "@/lib/work-items/health-preset-personalization";

const openCreate = vi.fn();
const preferenceMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  reset: vi.fn(async () => ({ status: "success" as const, message: "기본 순서로 복원했습니다." })),
  save: vi.fn(async (preferences: unknown) => {
    void preferences;
    return { status: "success" as const, message: "프리셋 설정을 저장했습니다." };
  }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: preferenceMocks.refresh }) }));
vi.mock("@/app/(app)/health-preset-preference-actions", () => ({
  resetHealthPresetPreferencesAction: preferenceMocks.reset,
  saveHealthPresetPreferencesAction: preferenceMocks.save,
}));

describe("AnnualPlanner", () => {
  beforeEach(() => {
    openCreate.mockClear();
    preferenceMocks.refresh.mockClear();
    preferenceMocks.save.mockClear();
  });

  function renderPlanner(
    customItems: Parameters<typeof AnnualPlanner>[0]["customItems"] = [],
    preferences: readonly HealthPresetPreference[] = defaultHealthPresetPreferences(),
  ) {
    render(
      <HealthPresetPreferencesProvider initialPreferences={preferences}>
        <AppShellCreateContext value={{ openCreate }}>
          <AnnualPlanner currentMonth={7} currentYear={2026} customItems={customItems} existingItems={[]} year={2026} />
        </AppShellCreateContext>
      </HealthPresetPreferencesProvider>,
    );
  }

  it("renders all twelve months and highlights the current month", () => {
    renderPlanner();

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(12);
    expect(screen.getByText("이번 달")).toBeInTheDocument();
  });

  it("opens the existing task form without saving or forcing a date", () => {
    renderPlanner();

    fireEvent.click(screen.getByRole("button", { name: "학생건강검진 준비 업무로 추가" }));

    expect(openCreate).toHaveBeenCalledOnce();
    expect(openCreate).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement),
      "task",
      expect.objectContaining({
        title: "학생건강검진 준비",
        requiredDate: true,
        suggestedMonth: 5,
        suggestedYear: 2026,
      }),
    );
    expect(openCreate.mock.calls[0]?.[2]).not.toHaveProperty("scheduledDate");
  });

  it("opens the existing event form for an event recommendation", () => {
    renderPlanner();

    fireEvent.click(within(screen.getByRole("region", { name: "6월" })).getByRole("button", { name: "보건교육 실시 일정으로 추가" }));

    expect(openCreate).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement),
      "event",
      expect.objectContaining({ title: "보건교육 실시", suggestedMonth: 6 }),
    );
  });

  it("reveals recommendations beyond the first three without horizontal scrolling", () => {
    renderPlanner();
    expect(screen.queryByText("감염병 예방 안내")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "4월 추천 업무 더 보기" }));

    expect(screen.getByText("감염병 예방 안내")).toBeInTheDocument();
  });

  it("opens the current month by default", () => {
    renderPlanner();

    expect(screen.getByText("방학 중 보건실 정리")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7월 추천 업무 접기" })).toHaveAttribute("aria-expanded", "true");
  });

  it("shows a user custom item in its month and reuses the same creation form", () => {
    renderPlanner([{ id: "custom-1", month: 1, title: "우리 학교 점검", kind: "task", recommendedPeriod: "1월 중", estimatedMinutes: 20, recurrence: null, checklist: ["일정 확인"], description: "우리 학교 일정에 맞춘 업무", suggestedCategory: "other", source: "custom" }]);
    fireEvent.click(screen.getByRole("button", { name: "1월 추천 업무 더 보기" }));

    fireEvent.click(screen.getByRole("button", { name: "우리 학교 점검 업무로 추가" }));

    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "task", expect.objectContaining({ title: "우리 학교 점검", checklist: ["일정 확인"], requiredDate: true }));
  });

  it("shares favorite and hidden preferences with common annual presets", async () => {
    const preferences = defaultHealthPresetPreferences().map((item) => item.presetId === "health-log" ? { ...item, hidden: true } : item);
    renderPlanner([], preferences);

    expect(screen.queryByText("보건일지 작성 시작")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "약품·응급물품 재고 확인 즐겨찾기" }));

    await waitFor(() => expect(preferenceMocks.save).toHaveBeenCalledOnce());
    expect(preferenceMocks.save.mock.calls[0]?.[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ presetId: "emergency-supplies-check", favorite: true }),
    ]));
  });
});
