import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260917090000_create_practical_tools.sql"), "utf8");

describe("practical tools migration", () => {
  it("creates scoped tools and an ownership-protected schedule join", () => {
    expect(sql).toContain("create table public.practical_tools");
    expect(sql).toContain("scope in ('public','personal')");
    expect(sql).toContain("alter table public.practical_tools enable row level security");
    expect(sql).toContain("create table public.practical_schedule_tools");
    expect(sql).toContain("exists (select 1 from public.practical_tools t");
    expect(sql).toContain("t.scope = 'public' or t.owner_id = (select auth.uid())");
  });
});
