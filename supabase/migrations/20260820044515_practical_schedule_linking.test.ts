import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("practical schedule linking migration", () => {
  const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260820044515_practical_schedule_linking.sql"), "utf8");

  it("adds origin and optional sticker storage without changing the original migration", () => {
    expect(sql).toContain("add column if not exists practical_schedule_origin text");
    expect(sql).toContain("add column if not exists sticker_key text");
    expect(sql).toContain("events_practical_schedule_origin_check");
  });

  it("protects linked events and backfills existing projections", () => {
    expect(sql).toContain("on delete set null");
    expect(sql).toContain("enforce_practical_schedule_event_owner");
    expect(sql).toContain("schedule.user_id = new.user_id");
    expect(sql).toContain("set practical_schedule_origin = 'projected'");
    expect(sql).toContain("where practical_schedule_id is not null");
  });
});
