import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260730120000_add_reservation_end_date.sql",
  ),
  "utf8",
);

describe("multi-day reservation migration", () => {
  it("adds a nullable end date with a legacy-compatible range constraint", () => {
    expect(migration).toContain("add column end_date date");
    expect(migration).toContain("coalesce(end_date, reservation_date) >= reservation_date");
    expect(migration).toContain("NULL legacy rows are interpreted as reservation_date");
  });

  it("synchronizes the effective end date to linked calendar events", () => {
    expect(migration).toContain("end_date_value date := coalesce");
    expect(migration).toContain("end_date = end_date_value");
  });
});
