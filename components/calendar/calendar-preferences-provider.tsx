"use client";

import { createContext, use, useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";

import { CALENDAR_WEEK_START_STORAGE_KEY, DEFAULT_CALENDAR_WEEK_START, parseCalendarWeekStart, type CalendarWeekStart } from "@/lib/calendar/preferences";

type CalendarPreferencesValue = {
  readonly weekStart: CalendarWeekStart;
  readonly setWeekStart: (value: CalendarWeekStart) => void;
};

const CalendarPreferencesContext = createContext<CalendarPreferencesValue>({ weekStart: DEFAULT_CALENDAR_WEEK_START, setWeekStart: () => undefined });
const preferenceChangeEvent = "bogunon-calendar-preference-change";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(preferenceChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(preferenceChangeEvent, onStoreChange);
  };
}

function getSnapshot(): CalendarWeekStart {
  return parseCalendarWeekStart(window.localStorage.getItem(CALENDAR_WEEK_START_STORAGE_KEY));
}

function getServerSnapshot(): CalendarWeekStart {
  return DEFAULT_CALENDAR_WEEK_START;
}

export function CalendarPreferencesProvider({ children }: { readonly children: ReactNode }) {
  const weekStart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setWeekStart = useCallback((value: CalendarWeekStart) => {
    window.localStorage.setItem(CALENDAR_WEEK_START_STORAGE_KEY, value);
    window.dispatchEvent(new Event(preferenceChangeEvent));
  }, []);
  const value = useMemo(() => ({ weekStart, setWeekStart }), [setWeekStart, weekStart]);

  return <CalendarPreferencesContext value={value}>{children}</CalendarPreferencesContext>;
}

export function useCalendarPreferences() {
  return use(CalendarPreferencesContext);
}
