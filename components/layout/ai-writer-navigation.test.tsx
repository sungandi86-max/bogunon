import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GlobalNavigation } from "@/components/layout/global-navigation";
import { MobileBottomNavigation } from "@/components/layout/mobile-bottom-navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ai-writer",
}));

describe("AI writer navigation", () => {
  it("links to the AI writer from desktop navigation only", () => {
    render(
      <>
        <GlobalNavigation onAcademicImport={vi.fn()} onCreate={vi.fn()} />
        <MobileBottomNavigation onCreate={vi.fn()} />
      </>,
    );

    const desktop = screen.getByRole("navigation", { name: "주요 메뉴" });
    const mobile = screen.getByRole("navigation", { name: "모바일 주요 메뉴" });
    const desktopLink = within(desktop).getByRole("link", { name: "생기부 도우미" });
    expect(desktopLink).toHaveAttribute("href", "/ai-writer");
    expect(desktopLink).toHaveAttribute("aria-current", "page");
    expect(within(mobile).queryByRole("link", { name: "생기부 도우미" })).not.toBeInTheDocument();
  });
});
