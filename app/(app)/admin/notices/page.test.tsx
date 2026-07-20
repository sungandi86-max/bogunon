import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentProfile, listNotices } = vi.hoisted(() => ({ getCurrentProfile: vi.fn(), listNotices: vi.fn() }));
vi.mock("@/lib/notices/repository", () => ({ getCurrentProfile, listNotices }));
vi.mock("@/app/(app)/notices/actions", () => ({ saveNoticeAction: vi.fn(), deleteNoticeAction: vi.fn() }));

import AdminNoticesPage from "@/app/(app)/admin/notices/page";

describe("AdminNoticesPage authorization", () => {
  beforeEach(() => { getCurrentProfile.mockReset(); listNotices.mockReset(); listNotices.mockResolvedValue([]); });
  it("does not render administration for a regular user", async () => { getCurrentProfile.mockResolvedValue({ role: "user" }); render(await AdminNoticesPage()); expect(screen.getByRole("alert")).toHaveTextContent("접근 권한이 없습니다."); expect(listNotices).not.toHaveBeenCalled(); });
  it.each(["admin", "owner"])("renders notice administration for %s", async (role) => { getCurrentProfile.mockResolvedValue({ role }); render(await AdminNoticesPage()); expect(screen.getByRole("heading", { name: "공지 관리" })).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "새 공지 작성" })).toBeInTheDocument(); });
});
