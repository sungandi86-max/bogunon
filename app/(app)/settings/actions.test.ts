import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveSettingsAction } from "@/app/(app)/settings/actions";
import { upsertUserSettings } from "@/lib/settings/repository";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/settings/repository", () => ({ upsertUserSettings: vi.fn() }));

describe("settings actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts defaults for a first-time authenticated user", async () => {
    const form = new FormData();
    form.set("weekStartsOn", "monday");
    form.set("defaultEventMinutes", "30");
    form.set("eventRemindersEnabled", "on");
    form.set("taskDueRemindersEnabled", "on");
    form.set("exerciseEnabled", "on");
    form.set("writingAssistanceEnabled", "on");
    form.set("displayDensity", "default");
    await expect(saveSettingsAction({ status: "idle" }, form)).resolves.toEqual({ status: "success", message: "설정을 저장했습니다." });
    expect(upsertUserSettings).toHaveBeenCalledWith({ weekStartsOn: "monday", defaultEventMinutes: 30, eventRemindersEnabled: true, taskDueRemindersEnabled: true, exerciseEnabled: true, writingAssistanceEnabled: true, displayDensity: "default" });
  });
});
