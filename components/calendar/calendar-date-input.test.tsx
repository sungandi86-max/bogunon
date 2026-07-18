import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { CalendarDateInput } from "@/components/calendar/calendar-date-input";
import { CalendarPreferencesProvider } from "@/components/calendar/calendar-preferences-provider";
import { CalendarPreferencesCard } from "@/components/settings/calendar-preferences-card";

describe("CalendarDateInput", () => {
  beforeEach(() => localStorage.clear());

  it("uses the shared Sunday-first preference by default", () => {
    const { container } = render(<CalendarPreferencesProvider><CalendarDateInput defaultValue="2026-07-18" name="date" /></CalendarPreferencesProvider>);

    fireEvent.click(screen.getByRole("button", { name: "2026-07-18 날짜 선택 열기" }));
    expect(container.querySelector(".calendar-date-input__weekdays")?.textContent).toBe("일월화수목금토");
  });

  it("reflows to Monday-first immediately and submits the selected date", () => {
    const { container } = render(<CalendarPreferencesProvider><CalendarPreferencesCard /><CalendarDateInput defaultValue="2026-07-01" name="date" /></CalendarPreferencesProvider>);

    fireEvent.click(screen.getByLabelText("월요일"));
    fireEvent.click(screen.getByRole("button", { name: "2026-07-01 날짜 선택 열기" }));
    expect(container.querySelector(".calendar-date-input__weekdays")?.textContent).toBe("월화수목금토일");

    const dialog = screen.getByRole("dialog", { name: "날짜 선택" });
    fireEvent.click(within(dialog).getByRole("button", { name: "19" }));
    expect(container.querySelector('input[name="date"]')).toHaveValue("2026-07-19");
  });
});
