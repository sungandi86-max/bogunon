import { describe, expect, it, vi } from "vitest";

const { createReport } = vi.hoisted(() => ({ createReport: vi.fn() }));
vi.mock("@/lib/reports/repository", () => ({ createReport }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createReportAction } from "./actions";

describe("createReportAction", () => {
  it("rejects missing title before writing", async () => {
    const form = new FormData();
    form.set("reportType", "bug");
    form.set("description", "문제가 발생했습니다.");
    const result = await createReportAction({ status: "idle" }, form);
    expect(result.status).toBe("error");
    expect(createReport).not.toHaveBeenCalled();
  });
});
