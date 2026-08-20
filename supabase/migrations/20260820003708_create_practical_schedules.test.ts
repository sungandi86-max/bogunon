import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("practical schedules migration", () => {
  it("defines optional-date owned work records and a calendar projection link", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260820003708_create_practical_schedules.sql"), "utf8");
    expect(sql).toContain("create table if not exists public.health_practical_schedules");
    expect(sql).toContain("scheduled_date date");
    expect(sql).toContain("url ~* '^https?://'");
    expect(sql).toContain("alter table public.events add column if not exists practical_schedule_id uuid");
    expect(sql).toContain("alter table public.health_practical_schedules enable row level security");
    expect(sql).toContain("using ((select auth.uid()) = user_id)");
    expect(sql).toContain("with check ((select auth.uid()) = user_id)");
  });
});
