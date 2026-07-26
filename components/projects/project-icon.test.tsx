import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectIcon } from "@/components/projects/project-icon";
import type { ProjectIcon as ProjectIconKey } from "@/types/database";

describe("ProjectIcon", () => {
  it("falls back to the folder icon for an unexpected stored value", () => {
    const { container } = render(<ProjectIcon icon={"unexpected" as ProjectIconKey} />);

    expect(container.querySelector(".lucide-folder")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
