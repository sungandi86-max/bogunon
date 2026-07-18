import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HealthPresetQuickAdd } from "@/components/tasks/health-preset-quick-add";
import { HEALTH_PRESETS } from "@/lib/work-items/health-presets";

const openCreate = vi.fn();

vi.mock("@/components/layout/app-shell-create-context", () => ({
  useAppShellCreate: () => ({ openCreate }),
}));

describe("HealthPresetQuickAdd", () => {
  beforeEach(() => {
    openCreate.mockClear();
    window.localStorage.clear();
  });

  it("shows six presets before expanding to the full list", () => {
    render(<HealthPresetQuickAdd />);

    expect(screen.getByRole("heading", { name: "자주 하는 보건업무" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /프리셋 적용$/ })).toHaveLength(6);
    expect(screen.queryByRole("button", { name: "보건교육 실시 프리셋 적용" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "전체 보기" }));

    expect(screen.getAllByRole("button", { name: /프리셋 적용$/ })).toHaveLength(12);
    expect(screen.getByRole("button", { name: "보건교육 결과 보고 프리셋 적용" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "일지·기록" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "보고·제출" })).toBeInTheDocument();
  });

  it("opens the shared create flow with the selected preset", () => {
    render(<HealthPresetQuickAdd />);

    fireEvent.click(screen.getByRole("button", { name: "보건일지 작성 프리셋 적용" }));

    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "task", HEALTH_PRESETS[0]);
  });

  it("shows up to four recently selected presets from client storage", () => {
    window.localStorage.setItem("bogunon.recent-health-presets", JSON.stringify([
      "health-education-report", "health-log", "health-newsletter", "bedding-laundry", "health-screening-preparation",
    ]));

    render(<HealthPresetQuickAdd />);

    expect(screen.getByRole("heading", { name: "최근 사용" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /최근 사용$/ })).toHaveLength(4);
  });

  it("opens the create form when browser storage is unavailable", () => {
    const storageRead = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage is disabled", "SecurityError");
    });

    render(<HealthPresetQuickAdd />);
    fireEvent.click(screen.getByRole("button", { name: "보건일지 작성 프리셋 적용" }));

    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "task", HEALTH_PRESETS[0]);
    storageRead.mockRestore();
  });
});
