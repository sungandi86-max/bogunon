import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260818001818_add_health_support_instructors.sql"),
  "utf8",
);

describe("health support instructor storage migration", () => {
  it("creates the requested instructor settings without student or derived work data", () => {
    // Given: the migration source
    const forbiddenColumns = ["work_hours", "weekday", "iso_week", "week_number", "month_total", "monthly_total"];

    // When: its persistent schema is inspected
    const containsForbiddenColumn = forbiddenColumns.some((column) => new RegExp(`\\b${column}\\b`, "i").test(migration));

    // Then: only source fields and the requested instructor settings are stored
    expect(migration).toContain("create table public.health_support_instructors");
    expect(migration).toContain("name text not null");
    expect(migration).toContain("subject text not null");
    expect(migration).toContain("weekly_hours numeric");
    expect(migration).toContain("hourly_rate numeric");
    expect(migration).toContain("monthly_insurance numeric");
    expect(migration).toContain("monthly_hour_limit numeric");
    expect(migration).toContain("weekly_hour_limit numeric");
    expect(migration).toContain("total_budget numeric");
    expect(migration).toContain("operation_start_date date not null");
    expect(migration).toContain("operation_end_date date not null");
    expect(migration).toContain("create table public.health_support_work_logs");
    expect(migration).toContain("work_date date not null");
    expect(migration).toContain("start_time time not null");
    expect(migration).toContain("end_time time not null");
    expect(migration).toContain("note text");
    expect(containsForbiddenColumn).toBe(false);
    expect(migration).not.toMatch(/student|roster/i);
  });

  it("enforces owned instructor links, valid input, timestamps, and four-operation RLS", () => {
    // Given: the migration source
    const tables = ["health_support_instructors", "health_support_work_logs"] as const;

    // When: table protections are inspected
    const ownerPoliciesPresent = tables.every((table) => ["select", "insert", "update", "delete"].every((operation) => migration.includes(`${table}_${operation}_own`)));

    // Then: foreign-owner links and second-user CRUD are rejected by database constraints and policies
    expect(migration).toContain("health_support_instructors_user_id_id_key unique (user_id, id)");
    expect(migration).toContain("health_support_work_logs_owned_instructor_fk");
    expect(migration).toContain("foreign key (user_id, instructor_id)");
    expect(migration).toContain("references public.health_support_instructors(user_id, id)");
    expect(migration).toContain("health_support_work_logs_time_range_check");
    expect(migration).toContain("end_time > start_time");
    expect(migration).toContain("health_support_instructors_operation_date_range_check");
    expect(migration).toContain("operation_end_date >= operation_start_date");
    expect(migration).toContain("health_support_instructors_set_updated_at");
    expect(migration).toContain("health_support_work_logs_set_updated_at");
    expect(migration).toContain("alter table public.health_support_instructors enable row level security");
    expect(migration).toContain("alter table public.health_support_work_logs enable row level security");
    expect(migration).toContain("with check (user_id = auth.uid())");
    expect(ownerPoliciesPresent).toBe(true);
  });
});
