import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompactMonthCalendar } from "@/components/calendar/compact-month-calendar";

describe("CompactMonthCalendar", () => {
  it("selects a date and supports arrow-key focus movement", () => {
    render(<CompactMonthCalendar />);
    const today = screen.getByRole("button", { name: /7월 17일/ });
    const nextDay = screen.getByRole("button", { name: /7월 18일/ });

    today.focus();
    fireEvent.keyDown(today, { key: "ArrowRight" });
    expect(nextDay).toHaveFocus();

    fireEvent.click(nextDay);
    expect(nextDay).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("7월 18일")).toBeInTheDocument();
  });
});
