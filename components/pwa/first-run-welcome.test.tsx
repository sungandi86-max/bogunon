import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FirstRunWelcome } from "@/components/pwa/first-run-welcome";

describe("FirstRunWelcome", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    });
  });

  it("shows once in standalone mode and stores only acknowledgement", async () => {
    const { unmount } = render(<FirstRunWelcome />);
    expect(await screen.findByRole("dialog", { name: "BOGUNON에 오신 것을 환영합니다." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "시작하기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage).toHaveLength(1);

    unmount();
    render(<FirstRunWelcome />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not show in a browser tab", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    });
    const { container } = render(<FirstRunWelcome />);
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
  });
});
