import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GlobalNavigation } from "@/components/layout/global-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/health-support-instructors" }));

describe("GlobalNavigation", () => {
  it("keeps record navigation available and marks the instructor manager current", () => {
    render(<GlobalNavigation onAcademicImport={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByRole("link", { name: "보건지원강사 관리" })).toHaveAttribute("href", "/health-support-instructors");
    expect(screen.getByRole("link", { name: "보건지원강사 관리" })).toHaveAttribute("aria-current", "page");
  });
});
