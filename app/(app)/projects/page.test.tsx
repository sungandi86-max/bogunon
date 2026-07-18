import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

import ProjectsPage from "@/app/(app)/projects/page";

describe("legacy projects route", () => {
  beforeEach(() => redirect.mockClear());

  it("redirects old project bookmarks to tasks", () => {
    ProjectsPage();

    expect(redirect).toHaveBeenCalledWith("/tasks");
  });
});
