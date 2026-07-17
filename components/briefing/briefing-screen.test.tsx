import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BriefingScreen } from "@/components/briefing/briefing-screen";
import { AppShell } from "@/components/layout/app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/briefing",
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
    expect(screen.getByText("오늘 일정이 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "모바일 주요 메뉴" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "업무" }));
    expect(screen.getByRole("dialog", { name: "새로 만들기" })).toBeInTheDocument();
  });
});
