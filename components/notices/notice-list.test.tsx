import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoticeList } from "@/components/notices/notice-list";
import type { Notice } from "@/lib/notices/model";

const markRead = vi.fn();
vi.mock("@/app/(app)/notices/actions", () => ({ markNoticeReadAction: (data: FormData) => markRead(data) }));
const notice: Notice = { id: "10000000-0000-0000-0000-000000000001", title: "주간 캘린더 업데이트", summary: "새 기능을 확인하세요.", content: "첫 줄\n둘째 줄", category: "update", isPublished: true, isImportant: true, publishStartAt: "2026-07-20T00:00:00Z", publishEndAt: null, createdBy: "owner", createdAt: "2026-07-20T00:00:00Z", updatedAt: "2026-07-20T00:00:00Z", isRead: false };

describe("NoticeList", () => {
  beforeEach(() => { markRead.mockReset(); markRead.mockResolvedValue(undefined); });
  it("shows the empty notice state", () => { render(<NoticeList notices={[]} />); expect(screen.getByText("등록된 공지가 없습니다.")).toBeInTheDocument(); });
  it("marks a notice read only when its detail opens", async () => { render(<NoticeList notices={[notice]} />); expect(markRead).not.toHaveBeenCalled(); fireEvent.click(screen.getByText("주간 캘린더 업데이트")); await waitFor(() => expect(markRead).toHaveBeenCalledOnce()); expect(screen.queryByText("NEW")).not.toBeInTheDocument(); expect(screen.getByText(/첫 줄/)).toHaveTextContent("첫 줄 둘째 줄"); });
});
