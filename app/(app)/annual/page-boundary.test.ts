import { isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import AnnualPage from "@/app/(app)/annual/page";
import { AnnualPlanner } from "@/components/annual/annual-planner";

vi.mock("@/lib/annual-planner/repository", () => ({ listAnnualPlannerCustomItems: vi.fn(async () => []) }));
vi.mock("@/lib/work-items/repository", () => ({
  listTasks: vi.fn(async () => []),
  listEvents: vi.fn(async () => []),
}));

function findElement(node: ReactNode, targetType: ReactElement["type"]): ReactElement<Record<string, unknown>> | undefined {
  if (isValidElement<Record<string, unknown>>(node)) {
    if (node.type === targetType) return node;
    return findElement(node.props["children"] as ReactNode, targetType);
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child as ReactNode, targetType);
      if (match) return match;
    }
  }
  return undefined;
}

describe("annual planner server boundary", () => {
  it("passes only serializable values to the client planner", async () => {
    const page = await AnnualPage({ searchParams: Promise.resolve({ year: "2026" }) });
    const planner = findElement(page, AnnualPlanner);

    expect(planner).toBeDefined();
    expect(planner?.props["year"]).toBe(2026);
    expect(planner?.props["customItems"]).toEqual([]);
    expect(Object.values(planner?.props ?? {}).some((value) => typeof value === "function")).toBe(false);
  });
});
