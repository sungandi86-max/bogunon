import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GlobalNavigation } from "@/components/layout/global-navigation";
import { MobileBottomNavigation } from "@/components/layout/mobile-bottom-navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("project navigation", () => {
  it("links to projects from desktop and mobile navigation", () => {
    render(
      <>
        <GlobalNavigation onAcademicImport={vi.fn()} onCreate={vi.fn()} />
        <MobileBottomNavigation onCreate={vi.fn()} />
      </>,
    );

    const desktop = screen.getByRole("navigation", { name: "주요 메뉴" });
    const mobile = screen.getByRole("navigation", { name: "모바일 주요 메뉴" });

    expect(within(desktop).getByRole("link", { name: "프로젝트" })).toHaveAttribute("href", "/projects");
    expect(within(mobile).getByRole("link", { name: "프로젝트" })).toHaveAttribute("href", "/projects");
  });
});
