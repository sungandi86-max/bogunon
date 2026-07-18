import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";

import {
  resetHealthPresetPreferencesAction,
  saveHealthPresetPreferencesAction,
} from "@/app/(app)/health-preset-preference-actions";
import {
  resetHealthPresetPreferences,
  saveHealthPresetPreferences,
} from "@/lib/work-items/health-preset-preferences-repository";
import { defaultHealthPresetPreferences } from "@/lib/work-items/health-preset-personalization";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/work-items/health-preset-preferences-repository", () => ({
  resetHealthPresetPreferences: vi.fn(),
  saveHealthPresetPreferences: vi.fn(),
}));

describe("health preset preference actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves preferences and revalidates every shared surface", async () => {
    const preferences = defaultHealthPresetPreferences();

    await expect(saveHealthPresetPreferencesAction(preferences)).resolves.toEqual({
      status: "success",
      message: "프리셋 설정을 저장했습니다.",
    });

    expect(saveHealthPresetPreferences).toHaveBeenCalledWith(preferences);
    expect(vi.mocked(revalidatePath).mock.calls.map(([path]) => path)).toEqual([
      "/tasks", "/annual", "/briefing", "/calendar",
    ]);
  });

  it("deletes only user preferences when restoring defaults", async () => {
    await expect(resetHealthPresetPreferencesAction()).resolves.toEqual({
      status: "success",
      message: "기본 순서로 복원했습니다.",
    });

    expect(resetHealthPresetPreferences).toHaveBeenCalledOnce();
  });

  it("returns a recoverable error without revalidation when persistence fails", async () => {
    vi.mocked(saveHealthPresetPreferences).mockRejectedValueOnce(new Error("저장 실패"));

    await expect(saveHealthPresetPreferencesAction(defaultHealthPresetPreferences())).resolves.toEqual({
      status: "error",
      message: "저장 실패",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
