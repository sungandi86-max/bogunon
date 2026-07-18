import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsForm } from "@/components/settings/settings-form";
import { CalendarPreferencesProvider } from "@/components/calendar/calendar-preferences-provider";
import { CALENDAR_WEEK_START_STORAGE_KEY } from "@/lib/calendar/preferences";
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/domain";

vi.mock("@/app/(app)/settings/actions", () => ({ saveSettingsAction: vi.fn(async () => ({ status: "success", message: "설정을 저장했습니다." })) }));

describe("SettingsForm", () => {
  beforeEach(() => localStorage.clear());

  it("shows defaults and connected account without a false empty state", () => {
    render(<CalendarPreferencesProvider><SettingsForm email="teacher@example.com" initialValues={DEFAULT_USER_SETTINGS} /></CalendarPreferencesProvider>);
    expect(screen.getByLabelText("일요일")).toBeChecked();
    expect(screen.getByLabelText("기본 일정 시간")).toHaveValue("30");
    expect(screen.getByText("teacher@example.com")).toBeInTheDocument();
    expect(screen.getByText("동기화됨")).toBeInTheDocument();
    expect(screen.queryByText("저장된 설정이 없습니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("계정 연결 후 설정을 저장할 수 있습니다.")).not.toBeInTheDocument();
  });

  it("stores a Monday start locally and restores it after remount", async () => {
    const first = render(<CalendarPreferencesProvider><SettingsForm email="teacher@example.com" initialValues={DEFAULT_USER_SETTINGS} /></CalendarPreferencesProvider>);

    fireEvent.click(screen.getByLabelText("월요일"));
    expect(localStorage.getItem(CALENDAR_WEEK_START_STORAGE_KEY)).toBe("monday");
    first.unmount();
    render(<CalendarPreferencesProvider><SettingsForm email="teacher@example.com" initialValues={DEFAULT_USER_SETTINGS} /></CalendarPreferencesProvider>);

    await waitFor(() => expect(screen.getByLabelText("월요일")).toBeChecked());
  });
});
