import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileCreateButton } from "@/components/layout/mobile-create-button";

const openCreate = vi.fn();

vi.mock("@/components/layout/app-shell-create-context", () => ({
  useAppShellCreate: () => ({ openCreate }),
}));

describe("MobileCreateButton", () => {
  beforeEach(() => openCreate.mockClear());

  it("opens the shared create panel in event mode on the calendar", () => {
    render(<MobileCreateButton kind="event" />);

    fireEvent.click(screen.getByRole("button", { name: "새로 만들기" }));

    expect(openCreate).toHaveBeenCalledWith(expect.any(HTMLButtonElement), "event");
  });
});
