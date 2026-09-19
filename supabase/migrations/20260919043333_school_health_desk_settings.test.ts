import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260919043333_school_health_desk_settings.sql",
);

describe("School Health Desk settings migration", () => {
  it("creates a versioned settings table owned by the authenticated user", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create table public.school_health_desk_settings");
    expect(sql).toContain("user_id uuid primary key references auth.users(id) on delete cascade");
    expect(sql).toContain("check (settings_version = 1)");
    expect(sql).toContain("check (jsonb_typeof(settings) = 'object')");
    expect(sql).toContain("execute function public.set_updated_at()");
  });

  it("revokes anonymous access and grants authenticated own-row CRUD only", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("alter table public.school_health_desk_settings enable row level security");
    expect(sql).toContain("revoke all on table public.school_health_desk_settings from public, anon, authenticated");
    expect(sql).toContain("grant select, insert, update, delete on table public.school_health_desk_settings to authenticated");
    expect(sql.match(/create policy school_health_desk_settings_/g)).toHaveLength(4);
    expect(sql.match(/using \(\(select auth\.uid\(\)\) = user_id\)/g)).toHaveLength(3);
    expect(sql.match(/with check \(\(select auth\.uid\(\)\) = user_id\)/g)).toHaveLength(2);
  });
});
