import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileBottomNavigation } from "@/components/layout/mobile-bottom-navigation";

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/briefing",
  useRouter: () => ({ push: navigationMocks.push }),
}));

describe("MobileBottomNavigation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens the existing exercise record route before closing the create sheet", () => {
    render(<MobileBottomNavigation onCreate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "빠른 새로 만들기" }));
    const sheet = screen.getByRole("dialog", { name: "새로 만들기" });
    fireEvent.click(within(sheet).getByText("운동 기록", { exact: true }).closest("a, button")!);

    expect(navigationMocks.push).toHaveBeenCalledOnce();
    expect(navigationMocks.push).toHaveBeenCalledWith("/exercise?create=sticker");
    expect(screen.queryByRole("dialog", { name: "새로 만들기" })).not.toBeInTheDocument();
  });
});
