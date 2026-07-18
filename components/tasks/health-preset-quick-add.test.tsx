import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HealthPresetQuickAdd } from "@/components/tasks/health-preset-quick-add";
import { HealthPresetPreferencesProvider } from "@/components/health-presets/health-preset-preferences-context";
import { defaultHealthPresetPreferences } from "@/lib/work-items/health-preset-personalization";
import { HEALTH_PRESETS } from "@/lib/work-items/health-presets";

const openCreate = vi.fn();
const preferenceMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  reset: vi.fn(async () => ({ status: "success" as const, message: "기본 순서로 복원했습니다." })),
  save: vi.fn(async (preferences: unknown) => {
    void preferences;
    return { status: "success" as const, message: "프리셋 설정을 저장했습니다." };
  }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: preferenceMocks.refresh }) }));
vi.mock("@/app/(app)/health-preset-preference-actions", () => ({
  resetHealthPresetPreferencesAction: preferenceMocks.reset,
  saveHealthPresetPreferencesAction: preferenceMocks.save,
}));

vi.mock("@/components/layout/app-shell-create-context", () => ({
  useAppShellCreate: () => ({ openCreate }),
}));

describe("HealthPresetQuickAdd", () => {
  beforeEach(() => {
    openCreate.mockClear();
    preferenceMocks.refresh.mockClear();
    preferenceMocks.reset.mockClear();
    preferenceMocks.save.mockClear();
    window.localStorage.clear();
  });

  function renderQuickAdd() {
    return render(
      <HealthPresetPreferencesProvider initialPreferences={defaultHealthPresetPreferences()}>
        <HealthPresetQuickAdd />
      </HealthPresetPreferencesProvider>,
    );
  }

  it("shows six presets before expanding to the full list", () => {
    renderQuickAdd();

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
    renderQuickAdd();

    fireEvent.click(screen.getByRole("button", { name: "보건일지 작성 프리셋 적용" }));

    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "task", HEALTH_PRESETS[0]);
  });

  it("shows up to four recently selected presets from client storage", () => {
    window.localStorage.setItem("bogunon.recent-health-presets", JSON.stringify([
      "health-education-report", "health-log", "health-newsletter", "bedding-laundry", "health-screening-preparation",
    ]));

    renderQuickAdd();

    expect(screen.getByRole("heading", { name: /최근 사용/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /최근 사용$/ })).toHaveLength(4);
  });

  it("opens the create form when browser storage is unavailable", () => {
    const storageRead = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage is disabled", "SecurityError");
    });

    renderQuickAdd();
    fireEvent.click(screen.getByRole("button", { name: "보건일지 작성 프리셋 적용" }));

    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "task", HEALTH_PRESETS[0]);
    storageRead.mockRestore();
  });

  it("saves favorites, ordering, hidden state, and default reset separately from recent use", async () => {
    renderQuickAdd();

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "보건일지 작성 즐겨찾기" })));
    expect(preferenceMocks.save).toHaveBeenCalled();
    expect(preferenceMocks.save.mock.calls.at(-1)?.[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ presetId: "health-log", favorite: true }),
    ]));

    fireEvent.click(screen.getByRole("button", { name: "편집" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "보건소식지 작성·게시 위로 이동" })));
    expect(preferenceMocks.save).toHaveBeenCalledTimes(2);
    expect(preferenceMocks.save.mock.calls.at(-1)?.[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ presetId: "health-newsletter", sortOrder: 0 }),
    ]));

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "보건실 침구 세탁 숨기기" })));
    expect(preferenceMocks.save).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole("button", { name: "보건실 침구 세탁 프리셋 적용" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "숨긴 프리셋 관리" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "보건실 침구 세탁 복원" })));
    expect(preferenceMocks.save).toHaveBeenCalledTimes(4);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "기본 순서로 복원" })));
    expect(preferenceMocks.reset).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem("bogunon.recent-health-presets")).toBeNull();
  }, 15_000);
});
