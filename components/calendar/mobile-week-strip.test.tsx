import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { CalendarPreferencesProvider } from "@/components/calendar/calendar-preferences-provider";
import { MobileWeekStrip } from "@/components/calendar/mobile-week-strip";
import { CalendarPreferencesCard } from "@/components/settings/calendar-preferences-card";

describe("MobileWeekStrip", () => {
  beforeEach(() => localStorage.clear());

  it("reflows the real week immediately when the preference changes", () => {
    const { container, getByLabelText } = render(<CalendarPreferencesProvider><CalendarPreferencesCard /><MobileWeekStrip events={[]} today="2026-07-18" /></CalendarPreferencesProvider>);
    expect(container.querySelector(".week-strip-day")?.textContent).toContain("일12");

    fireEvent.click(getByLabelText("월요일"));
    expect(container.querySelector(".week-strip-day")?.textContent).toContain("월13");
  });
});
