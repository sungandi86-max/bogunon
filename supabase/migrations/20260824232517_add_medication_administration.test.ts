import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260824232517_add_medication_administration.sql"), "utf8");

describe("medication administration migration", () => {
  it("keeps item and expiry-lot history separate", () => {
    expect(migration).toContain("create table public.medication_items");
    expect(migration).toContain("create table public.medication_lots");
    expect(migration).toContain("receipt_id uuid");
    expect(migration).toContain("medication_items_unique_name");
  });
  it("supports partial purchase receipts and idempotent inventory application", () => {
    expect(migration).toContain("partially_received");
    expect(migration).toContain("unique (user_id, idempotency_key)");
    expect(migration).toContain("create or replace function public.receive_medication");
    expect(migration).toContain("on conflict (user_id, idempotency_key) do nothing");
  });
  it("enables ownership RLS for every medication table", () => {
    for (const table of ["medication_items", "medication_budgets", "medication_purchase_plans", "medication_receipts", "medication_lots"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(`user_id = auth.uid()`);
    }
  });
});
