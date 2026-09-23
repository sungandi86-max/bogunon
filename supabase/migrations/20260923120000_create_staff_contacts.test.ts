import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("staff contacts migration", () => {
  it("defines private contacts, emergency groups, cascades, and owner RLS", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260923120000_create_staff_contacts.sql"), "utf8");
    expect(sql).toContain("create table public.staff_contacts");
    expect(sql).toContain("create table public.staff_assignments");
    expect(sql).toContain("create table public.staff_contact_groups");
    expect(sql).toContain("create table public.staff_contact_group_members");
    expect(sql).toContain("unique (staff_id, school_year, semester)");
    expect(sql).toContain("on delete cascade");
    expect(sql).toContain("alter table public.staff_contacts enable row level security");
    expect(sql).toContain("using (user_id = auth.uid())");
    expect(sql).toContain("with check (user_id = auth.uid())");
    expect(sql).toContain("revoke all on table public.staff_contacts");
  });
});
