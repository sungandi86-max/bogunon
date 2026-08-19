import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260819090000_add_aed_devices.sql"), "utf8");

describe("AED device migration", () => {
  it("stores source fields needed for inspection management", () => {
    expect(migration).toContain("create table public.aed_devices");
    expect(migration).toContain("battery_expiry_date date");
    expect(migration).toContain("pad_expiry_date date");
    expect(migration).toContain("last_inspection_date date");
    expect(migration).toContain("next_inspection_date date");
    expect(migration).toContain("inspection_interval_months integer");
    expect(migration).toContain("sort_order integer");
  });

  it("enforces user isolation for all four operations", () => {
    expect(migration).toContain("alter table public.aed_devices enable row level security");
    expect(migration).toContain("aed_devices_select_own");
    expect(migration).toContain("aed_devices_insert_own");
    expect(migration).toContain("aed_devices_update_own");
    expect(migration).toContain("aed_devices_delete_own");
    expect(migration.match(/user_id = auth\.uid\(\)/g)?.length).toBeGreaterThanOrEqual(4);
  });
});
