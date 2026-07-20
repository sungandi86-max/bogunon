import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidebarOtter } from "@/components/layout/sidebar-otter";
import type { Notice } from "@/lib/notices/model";

const base = { summary: null, content: "내용", category: "notice", isPublished: true, publishStartAt: null, publishEndAt: null, createdBy: "owner", createdAt: "2026-07-20T00:00:00Z", updatedAt: "2026-07-20T00:00:00Z" } as const;
describe("SidebarOtter", () => {
  it("returns to the quiet message after every notice is read", () => { render(<SidebarOtter notices={[{ ...base, id: "1", title: "읽은 공지", isImportant: false, isRead: true }]} />); expect(screen.getByText("새로운 공지가 없습니다.")).toBeInTheDocument(); });
  it("prioritizes the first sorted unread notice and caps its badge", () => { const notices: readonly Notice[] = Array.from({ length: 10 }, (_, index) => ({ ...base, id: String(index), title: index === 0 ? "중요 안내" : `공지 ${index}`, isImportant: index === 0, isRead: false })); render(<SidebarOtter notices={notices} />); expect(screen.getByText("중요 안내")).toBeInTheDocument(); expect(screen.getByLabelText("읽지 않은 공지 10개")).toHaveTextContent("9+"); });
});
