import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidebarOtter } from "@/components/layout/sidebar-otter";
import type { Notice } from "@/lib/notices/model";

const base = { summary: null, content: "내용", category: "notice", isPublished: true, publishStartAt: null, publishEndAt: null, createdBy: "owner", createdAt: "2026-07-20T00:00:00Z", updatedAt: "2026-07-20T00:00:00Z" } as const;
describe("SidebarOtter", () => {
  it("returns to the quiet message after every notice is read", () => { render(<SidebarOtter notices={[{ ...base, id: "1", title: "읽은 공지", isImportant: false, isRead: true }]} />); expect(screen.getByText("새로운 공지가 없습니다.")).toBeInTheDocument(); });
  it("prioritizes the first sorted unread notice and caps its badge", () => { const notices: readonly Notice[] = Array.from({ length: 10 }, (_, index) => ({ ...base, id: String(index), title: index === 0 ? "중요 안내" : `공지 ${index}`, isImportant: index === 0, isRead: false })); render(<SidebarOtter notices={notices} />); expect(screen.getByText("중요 안내")).toBeInTheDocument(); expect(screen.getByLabelText("읽지 않은 공지 10개")).toHaveTextContent("9+"); });
  it("opens the latest notice in a body portal and closes it with Escape", () => {
    render(<SidebarOtter notices={[{ ...base, id: "1", title: "긴급 안내", content: "첫 문단\n\n둘째 문단", isImportant: true, isRead: false }]} />);
    fireEvent.click(screen.getByRole("button", { name: "긴급 안내 공지 상세 열기" }));
    expect(screen.getByRole("dialog", { name: "긴급 안내" }).parentElement?.parentElement).toBe(document.body);
    expect(document.body).toHaveClass("overlay-open");
    expect(within(screen.getByRole("dialog")).getByText(/첫 문단/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "공지 상세 닫기" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "확인" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "공지 상세 닫기" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass("overlay-open");
  });
  it("closes the notice when its overlay is clicked", () => {
    render(<SidebarOtter notices={[{ ...base, id: "1", title: "안내", isImportant: false, isRead: false }]} />);
    fireEvent.click(screen.getByRole("button", { name: "안내 공지 상세 열기" }));
    fireEvent.mouseDown(screen.getByTestId("notice-detail-overlay"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
