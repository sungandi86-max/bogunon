import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/app-shell";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";

const preferenceMocks = vi.hoisted(() => ({
  reset: vi.fn(async () => ({ status: "success" as const, message: "기본 순서로 복원했습니다." })),
  save: vi.fn(async (preferences: unknown) => {
    void preferences;
    return { status: "success" as const, message: "프리셋 설정을 저장했습니다." };
  }),
}));

vi.mock("@/app/(app)/health-preset-preference-actions", () => ({
  resetHealthPresetPreferencesAction: preferenceMocks.reset,
  saveHealthPresetPreferencesAction: preferenceMocks.save,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/briefing",
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("AppShell", () => {
  beforeEach(() => vi.clearAllMocks());

  it("moves account actions to the top header and reserves the sidebar footer for Sudari", () => {
    render(<AppShell profile={{ email: "teacher@example.com", initial: "T" }}><main>본문</main></AppShell>);

    const header = screen.getByRole("banner", { name: "사용자 헤더" });
    const sidebar = screen.getByRole("complementary", { name: "데스크톱 앱 메뉴" });
    expect(within(header).getByRole("button", { name: "teacher@example.com 사용자 메뉴" })).toBeInTheDocument();
    expect(within(sidebar).getByText("새로운 공지가 없습니다.")).toBeInTheDocument();
    expect(within(sidebar).getByRole("img", { name: "수다리" })).toHaveAttribute("src", expect.stringContaining("otter-profile.png"));
    expect(within(sidebar).queryByText("동기화됨")).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();

    fireEvent.click(within(header).getByRole("button", { name: "teacher@example.com 사용자 메뉴" }));
    expect(within(header).getAllByText("teacher@example.com")).toHaveLength(2);
    expect(within(header).getByRole("menuitem", { name: "설정" })).toHaveAttribute("href", "/settings");
    expect(within(header).getByRole("menuitem", { name: "로그아웃" })).toBeInTheDocument();
  });

  it("marks the current navigation item", () => {
    render(<AppShell><main>본문</main></AppShell>);

    expect(screen.getAllByRole("link", { name: "오늘" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "오늘" }).every((link) => link.getAttribute("aria-current") === "page")).toBe(true);
    expect(screen.getAllByRole("link", { name: "업무 절차" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "운동" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "프로젝트" })).not.toBeInTheDocument();
    expect(screen.getByText("보건업무")).toBeInTheDocument();
    expect(screen.getByText("나의 기록")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "AI 업무 도우미" })).not.toBeInTheDocument();
  });

  it("opens the floating mobile creation menu and reuses the task form", () => {
    render(<AppShell><main>본문</main></AppShell>);
    const launcher = screen.getByRole("button", { name: "빠른 새로 만들기" });

    fireEvent.click(launcher);
    const menu = screen.getByRole("dialog", { name: "새로 만들기" });
    expect(within(menu).getByRole("heading", { name: "빠른 보건업무" })).toBeInTheDocument();
    expect(within(menu).getAllByRole("button", { name: /보건업무 프리셋 적용$/ })).toHaveLength(6);
    expect(within(menu).queryByRole("link", { name: /업무 절차 시작/ })).not.toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: /운동 기록/ })).toHaveAttribute("href", "/exercise?create=sticker");
    expect(within(menu).getByRole("link", { name: /빠른 메모/ })).toHaveAttribute("href", "/briefing#quick-note");

    fireEvent.click(within(menu).getByRole("button", { name: /업무 추가/ }));
    expect(screen.getByLabelText("제목")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(launcher).toHaveFocus();
  });

  it("expands all twelve health presets without removing the existing mobile creation actions", () => {
    render(<AppShell><main>본문</main></AppShell>);
    fireEvent.click(screen.getByRole("button", { name: "빠른 새로 만들기" }));
    const menu = screen.getByRole("dialog", { name: "새로 만들기" });

    fireEvent.click(within(menu).getByRole("button", { name: "보건업무 전체 보기" }));

    expect(within(menu).getAllByRole("button", { name: /보건업무 프리셋 적용$/ })).toHaveLength(12);
    expect(within(menu).getByRole("heading", { name: "일지·기록" })).toBeInTheDocument();
    expect(within(menu).getByRole("heading", { name: "보고·제출" })).toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: /^업무 추가/ })).toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: /^일정 추가/ })).toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: /^개인 일정 추가/ })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: /운동 기록/ })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: /날짜 스티커 붙이기/ })).toBeInTheDocument();
    expect(within(menu).queryByRole("link", { name: /업무 절차 시작/ })).not.toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: /빠른 메모/ })).toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: /^작성 도움/ })).toBeInTheDocument();
    expect(within(menu).queryByText(/프로젝트/)).not.toBeInTheDocument();
  });

  it("personalizes mobile favorites, ordering, hidden presets, and restores defaults", async () => {
    render(<AppShell><main>본문</main></AppShell>);
    fireEvent.click(screen.getByRole("button", { name: "빠른 새로 만들기" }));
    const menu = screen.getByRole("dialog", { name: "새로 만들기" });

    await act(async () => fireEvent.click(within(menu).getByRole("button", { name: "보건일지 작성 즐겨찾기" })));
    expect(preferenceMocks.save).toHaveBeenCalledOnce();

    fireEvent.click(within(menu).getByRole("button", { name: "편집" }));
    await act(async () => fireEvent.click(within(menu).getByRole("button", { name: "보건소식지 작성·게시 위로 이동" })));
    expect(preferenceMocks.save).toHaveBeenCalledTimes(2);

    await act(async () => fireEvent.click(within(menu).getByRole("button", { name: "보건실 침구 세탁 숨기기" })));
    expect(preferenceMocks.save).toHaveBeenCalledTimes(3);
    expect(within(menu).queryByRole("button", { name: "보건실 침구 세탁 보건업무 프리셋 적용" })).not.toBeInTheDocument();

    fireEvent.click(within(menu).getByRole("button", { name: "숨긴 프리셋 관리" }));
    expect(within(menu).getByRole("button", { name: "보건실 침구 세탁 복원" })).toBeInTheDocument();
    await act(async () => fireEvent.click(within(menu).getByRole("button", { name: "기본 순서로 복원" })));
    expect(preferenceMocks.reset).toHaveBeenCalledOnce();
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
