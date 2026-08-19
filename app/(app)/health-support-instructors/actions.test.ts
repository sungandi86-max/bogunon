import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/health-support-instructors/repository", async (importOriginal) => {
  const repository = await importOriginal<typeof import("@/lib/health-support-instructors/repository")>();
  return { ...repository, createHealthSupportWorkLog: vi.fn(), updateHealthSupportWorkLog: vi.fn(), deleteHealthSupportWorkLog: vi.fn() };
});

import * as actions from "@/app/(app)/health-support-instructors/actions";
import { deleteHealthSupportWorkLogAction, saveHealthSupportWorkLogAction } from "@/app/(app)/health-support-instructors/actions";
import { revalidatePath } from "next/cache";
import { createHealthSupportWorkLog, deleteHealthSupportWorkLog, updateHealthSupportWorkLog } from "@/lib/health-support-instructors/repository";

const instructorId = "10000000-0000-4000-8000-000000000001";

describe("health support instructor actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports only callable Server Actions", () => {
    // Given: the module is marked with the Server Action directive.

    // When: its public API is inspected.

    // Then: synchronous parsing helpers remain private to the module.
    expect(actions).not.toHaveProperty("parseWorkLogActionInput");
  });

  it("passes a validated explicit-save payload to persistence for a valid work period", async () => {
    // Given: a form for an explicit save.
    const formData = new FormData();
    formData.set("instructorId", instructorId);
    formData.set("date", "2026-08-18");
    formData.set("startTime", "09:30");
    formData.set("endTime", "12:30");
    formData.set("note", "");

    // When: explicit save is requested.
    await saveHealthSupportWorkLogAction({ status: "idle" }, formData);

    // Then: it passes a persistence-ready payload to the repository.
    expect(createHealthSupportWorkLog).toHaveBeenCalledWith({ instructorId, date: "2026-08-18", startTime: "09:30", endTime: "12:30", note: null });
  });

  it("returns a clear validation error before any persistence call for reversed time", async () => {
    // Given: malformed time input and the action's connected persistence adapter.
    const formData = new FormData();
    formData.set("instructorId", instructorId);
    formData.set("date", "2026-08-18");
    formData.set("startTime", "12:30");
    formData.set("endTime", "09:30");

    // When: explicit save is requested.
    const result = await saveHealthSupportWorkLogAction({ status: "idle" }, formData);

    // Then: the action surfaces the domain error and cannot invoke its persistence adapter.
    expect(result).toEqual({ status: "error", message: "End time must be after start time" });
    expect(createHealthSupportWorkLog).not.toHaveBeenCalled();
  });

  it("runs create, update, delete, and route revalidation through explicit action requests", async () => {
    // Given: valid new, edited, and deleted work-log form submissions.
    const createForm = new FormData();
    createForm.set("instructorId", instructorId); createForm.set("date", "2026-08-18"); createForm.set("startTime", "09:30"); createForm.set("endTime", "12:30");
    const updateForm = new FormData();
    updateForm.set("id", "20000000-0000-4000-8000-000000000001"); updateForm.set("instructorId", instructorId); updateForm.set("date", "2026-08-18"); updateForm.set("startTime", "09:30"); updateForm.set("endTime", "12:30");
    const deleteForm = new FormData(); deleteForm.set("id", "20000000-0000-4000-8000-000000000001");

    // When: the user explicitly submits each action.
    await saveHealthSupportWorkLogAction({ status: "idle" }, createForm);
    await saveHealthSupportWorkLogAction({ status: "idle" }, updateForm);
    await deleteHealthSupportWorkLogAction(deleteForm);

    // Then: each matching repository mutation and only this module route refresh run.
    expect(createHealthSupportWorkLog).toHaveBeenCalledOnce();
    expect(updateHealthSupportWorkLog).toHaveBeenCalledOnce();
    expect(deleteHealthSupportWorkLog).toHaveBeenCalledWith("20000000-0000-4000-8000-000000000001");
    expect(revalidatePath).toHaveBeenCalledTimes(3);
    expect(revalidatePath).toHaveBeenCalledWith("/health-support-instructors");
  });
});
