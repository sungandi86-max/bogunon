import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FullMonthCalendar } from "@/components/calendar/full-month-calendar";

describe("FullMonthCalendar", () => {
  it("marks the supplied current date on its calendar cell", () => {
    render(<FullMonthCalendar month="2026-07" today="2026-07-18" />);

    expect(screen.getByRole("gridcell", { name: "2026년 7월 18일, 일정 0개" })).toHaveClass("is-today");
  });
});
