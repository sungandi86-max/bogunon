import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/health-support-instructors/repository", () => ({
  listHealthSupportInstructors: vi.fn(async () => []),
  listHealthSupportWorkLogs: vi.fn(async () => []),
}));
vi.mock("@/app/(app)/health-support-instructors/actions", () => ({ saveHealthSupportInstructorAction: vi.fn(), saveHealthSupportWorkLogAction: vi.fn(), deleteHealthSupportWorkLogAction: vi.fn<(formData: FormData) => Promise<void>>() }));
vi.mock("@/lib/work-items/repository", () => ({ listAllEvents: vi.fn(async () => []) }));

import HealthSupportInstructorsPage from "@/app/(app)/health-support-instructors/page";

describe("HealthSupportInstructorsPage", () => {
  it("renders the protected manager route with its action-first empty state", async () => {
    render(await HealthSupportInstructorsPage());

    expect(screen.getByRole("heading", { level: 1, name: "보건지원강사 관리" })).toBeInTheDocument();
    expect(screen.getByText("등록된 보건지원강사가 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "강사 정보 등록" })).toBeInTheDocument();
  });
});
