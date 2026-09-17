import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationPath = join(process.cwd(), "supabase", "migrations", "20260917120000_create_user_reports.sql");

describe("user reports migration", () => {
  it("defines private-user and admin policies without storage or delete access", () => {
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toContain("create table public.user_reports");
    expect(sql).toContain("create table public.user_report_admin_notes");
    expect(sql).toContain("alter table public.user_reports enable row level security");
    expect(sql).toContain("revoke all on table public.user_reports from public, anon, authenticated");
    expect(sql).toContain("grant insert (user_id, report_type, title, description");
    expect(sql).toContain("private.is_notice_admin()");
    expect(sql).toContain("user_id = (select auth.uid())");
    expect(sql).not.toMatch(/create policy .*delete/iu);
    expect(sql).not.toContain("storage.create_bucket");
  });
});
