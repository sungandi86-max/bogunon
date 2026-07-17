import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/app-shell";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";

vi.mock("next/navigation", () => ({
  usePathname: () => "/briefing",
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("AppShell", () => {
  it("marks the current navigation item", () => {
    render(<AppShell><main>본문</main></AppShell>);

    expect(screen.getAllByRole("link", { name: "오늘" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "오늘" }).every((link) => link.getAttribute("aria-current") === "page")).toBe(true);
    expect(screen.getAllByRole("link", { name: "업무 절차" })).toHaveLength(2);
    expect(screen.getByText("보건업무")).toBeInTheDocument();
    expect(screen.getByText("나의 기록")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "AI 업무 도우미" })).not.toBeInTheDocument();
  });

  it("opens the floating mobile creation menu and reuses the task form", () => {
    render(<AppShell><main>본문</main></AppShell>);
    const launcher = screen.getByRole("button", { name: "빠른 새로 만들기" });

    fireEvent.click(launcher);
    const menu = screen.getByRole("dialog", { name: "새로 만들기" });
    expect(within(menu).getByRole("link", { name: /업무 절차 시작/ })).toHaveAttribute("href", "/workflows");
    expect(within(menu).getByRole("link", { name: /운동 기록/ })).toHaveAttribute("href", "/exercise?create=1");
    expect(within(menu).getByRole("link", { name: /빠른 메모/ })).toHaveAttribute("href", "/briefing#quick-note");

    fireEvent.click(within(menu).getByRole("button", { name: /업무 만들기/ }));
    expect(screen.getByLabelText("제목")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(launcher).toHaveFocus();
  });

  it("opens the create panel, closes with Escape, and returns focus", () => {
    render(<AppShell><main>본문</main></AppShell>);
    const launcher = screen.getByRole("button", { name: "새로 만들기" });

    fireEvent.click(launcher);
    const createTask = screen.getByRole("button", { name: "업무 만들기" });
    fireEvent.click(createTask);
    expect(screen.getByRole("dialog", { name: "새로 만들기" })).toBeInTheDocument();
    expect(screen.getByLabelText("제목")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "새로 만들기" })).not.toBeInTheDocument();
    expect(createTask).toHaveFocus();
  });

  it("returns focus to the mobile create launcher", () => {
    const { container } = render(
      <AppShell>
        <main><MobileCreateButton /></main>
      </AppShell>,
    );
    const launcher = container.querySelector<HTMLButtonElement>(".mobile-create-button");
    if (!launcher) throw new Error("모바일 새로 만들기 버튼이 필요합니다.");

    fireEvent.click(launcher);
    expect(screen.getByLabelText("제목")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(launcher).toHaveFocus();
  });

  it("moves a confirmed AI task draft into the existing create form", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ mode: "mock", action: {
        action: "create_task", title: "약품 점검", description: "월간 재고 점검",
        category: "medication", priority: "high", scheduled_date: "2026-07-20",
        due_date: "2026-07-21", recurrence: "monthly", checklist: ["재고 확인"],
      } }),
    }));
    render(<AppShell><main>본문</main></AppShell>);
    fireEvent.click(screen.getByRole("button", { name: "새로 만들기" }));
    fireEvent.click(screen.getByRole("button", { name: "작성 도움" }));
    fireEvent.change(screen.getByLabelText("AI 요청"), { target: { value: "매월 약품 점검 업무 만들어줘" } });
    fireEvent.click(screen.getByRole("button", { name: "초안 만들기" }));
    expect(await screen.findByText("구조화된 미리보기")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "생성 폼에서 확인" }));

    expect(screen.getByRole("dialog", { name: "새로 만들기" })).toBeInTheDocument();
    expect(screen.getByLabelText("제목")).toHaveValue("약품 점검");
    expect(screen.getByLabelText("수행일")).toHaveValue("2026-07-20");
    expect(screen.getByLabelText("마감일")).toHaveValue("2026-07-21");
    expect(screen.getByLabelText("체크리스트 1")).toHaveValue("재고 확인");
  });
});
