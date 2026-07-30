import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260730062000_allow_travel_project_icon.sql"),
  "utf8",
);

describe("travel project icon migration", () => {
  it("keeps the existing icon constraint and adds travel", () => {
    expect(migration).toContain("drop constraint if exists projects_icon_allowed_check");
    expect(migration).toContain(
      "check (icon in ('folder', 'calendar', 'school', 'heart', 'flag', 'star', 'travel'))",
    );
  });
});
