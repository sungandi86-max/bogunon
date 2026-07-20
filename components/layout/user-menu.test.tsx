import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserMenu } from "@/components/layout/user-menu";

describe("UserMenu role navigation", () => {
  it("hides notice management from a regular user", () => {
    render(<UserMenu profile={{ email: "user@example.com", initial: "U", displayName: "사용자", avatarUrl: null, role: "user" }} />);
    fireEvent.click(screen.getByRole("button", { name: /사용자 메뉴/ }));
    expect(screen.queryByRole("menuitem", { name: "공지 관리" })).not.toBeInTheDocument();
    expect(screen.getAllByText("사용자")).toHaveLength(2);
  });

  it("shows notice management to an owner", () => {
    render(<UserMenu profile={{ email: "owner@example.com", initial: "O", displayName: "운영자", avatarUrl: null, role: "owner" }} />);
    fireEvent.click(screen.getByRole("button", { name: /사용자 메뉴/ }));
    expect(screen.getByRole("menuitem", { name: "공지 관리" })).toHaveAttribute("href", "/admin/notices");
    expect(screen.getByText("최고 관리자")).toBeInTheDocument();
  });

  it("shows a capped unread notice badge on mobile account navigation", () => {
    const notices = Array.from({ length: 10 }, (_, index) => ({ id: String(index), title: "공지", summary: null, content: "내용", category: "notice" as const, isPublished: true, isImportant: false, publishStartAt: null, publishEndAt: null, createdBy: "owner", createdAt: "2026-07-20T00:00:00Z", updatedAt: "2026-07-20T00:00:00Z", isRead: false }));
    render(<UserMenu notices={notices} profile={{ email: "user@example.com", initial: "U", displayName: "사용자", avatarUrl: null, role: "user" }} />);
    fireEvent.click(screen.getByRole("button", { name: /사용자 메뉴/ }));
    expect(screen.getByLabelText("읽지 않은 공지 10개")).toHaveTextContent("9+");
  });
});
