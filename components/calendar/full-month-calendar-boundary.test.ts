import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const calendarSource = readFileSync(resolve(process.cwd(), "components/calendar/full-month-calendar.tsx"), "utf8");
const briefingSource = readFileSync(resolve(process.cwd(), "components/briefing/briefing-screen.tsx"), "utf8");

describe("FullMonthCalendar server/client boundary", () => {
  it("owns its DOM event handlers behind a client component boundary", () => {
    expect(calendarSource.trimStart().startsWith('"use client";')).toBe(true);
  });

  it("receives only serializable props from the briefing server render path", () => {
    const usage = briefingSource.match(/<FullMonthCalendar[^>]*\/>/)?.[0] ?? "";
    expect(usage).not.toMatch(/\son[A-Z][A-Za-z]+=/);
    expect(usage).toContain("events={events}");
    expect(usage).toContain("month={month}");
  });
});
