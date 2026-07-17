import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/app-shell";
import { MobileCreateButton } from "@/components/layout/mobile-create-button";

vi.mock("next/navigation", () => ({
  usePathname: () => "/briefing",
}));

describe("AppShell", () => {
  it("marks the current navigation item", () => {
    render(<AppShell><main>본문</main></AppShell>);

    const briefingLinks = screen.getAllByRole("link", { name: "브리핑" });
    expect(briefingLinks).toHaveLength(2);
    expect(briefingLinks.every((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("opens the create panel, closes with Escape, and returns focus", () => {
    render(<AppShell><main>본문</main></AppShell>);
    const launcher = screen.getByRole("button", { name: "새로 만들기" });

    fireEvent.click(launcher);
    expect(screen.getByRole("dialog", { name: "새로 만들기" })).toBeInTheDocument();
    expect(screen.getByLabelText("제목")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "새로 만들기" })).not.toBeInTheDocument();
    expect(launcher).toHaveFocus();
  });

  it("returns focus to the mobile create launcher", () => {
    const { container } = render(
      <AppShell>
        <main><MobileCreateButton /></main>
      </AppShell>,
    );
    const launcher = container.querySelector<HTMLButtonElement>(".mobile-create-button");
    if (!launcher) throw new Error("모바일 새로 만들기 버튼이 필요합니다.");

    fireEvent.click(launcher);
    expect(screen.getByLabelText("제목")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(launcher).toHaveFocus();
  });
});
