import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260808120000_add_project_places.sql"), "utf8");

describe("project places migration", () => {
  it("creates owner-scoped places with optional paired coordinates", () => {
    expect(migration).toContain("create table public.project_places");
    expect(migration).toContain("project_places_coordinate_pair_check");
    expect(migration).toContain("project_places_owned_project_fk");
    expect(migration).toContain("on delete cascade");
  });

  it("keeps places while clearing deleted event and reservation links", () => {
    expect(migration).toContain("event_id uuid references public.events(id) on delete set null");
    expect(migration).toContain("reservation_id uuid references public.project_reservations(id) on delete set null");
    expect(migration).toContain("place event owner or project mismatch");
    expect(migration).toContain("place reservation owner or project mismatch");
  });

  it("enables four-operation RLS and secure route ordering", () => {
    expect(migration).toContain("alter table public.project_places enable row level security");
    expect(migration).toContain("project_places_select_own");
    expect(migration).toContain("project_places_insert_own");
    expect(migration).toContain("project_places_update_own");
    expect(migration).toContain("project_places_delete_own");
    expect(migration).toContain("reorder_project_places");
  });
});
