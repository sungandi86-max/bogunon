import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAnnualPlannerCustomItemAction } from "@/app/(app)/annual/actions";
import { createAnnualPlannerCustomItem } from "@/lib/annual-planner/repository";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/annual-planner/repository", () => ({ createAnnualPlannerCustomItem: vi.fn(async () => "custom-id") }));

describe("createAnnualPlannerCustomItemAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an invalid item kind without writing", async () => {
    const formData = new FormData();
    formData.set("month", "5");
    formData.set("title", "우리 학교 검진 준비");
    formData.set("itemKind", "unknown");

    await expect(createAnnualPlannerCustomItemAction({ status: "idle" }, formData)).resolves.toEqual({
      status: "error",
      message: "업무 또는 일정을 선택해 주세요.",
    });
    expect(vi.mocked(createAnnualPlannerCustomItem)).not.toHaveBeenCalled();
  });

  it("normalizes checklist lines before creating a user item", async () => {
    const formData = new FormData();
    formData.set("month", "5");
    formData.set("title", "우리 학교 검진 준비");
    formData.set("itemKind", "task");
    formData.set("estimatedMinutes", "30");
    formData.set("checklist", "일정 확인\n\n 준비물 확인 ");

    await expect(createAnnualPlannerCustomItemAction({ status: "idle" }, formData)).resolves.toEqual({
      status: "success",
      message: "내 업무를 추가했습니다.",
    });
    expect(vi.mocked(createAnnualPlannerCustomItem)).toHaveBeenCalledWith(expect.objectContaining({
      month: 5,
      itemKind: "task",
      checklist: ["일정 확인", "준비물 확인"],
    }));
  });
});
