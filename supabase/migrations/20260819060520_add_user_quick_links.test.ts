import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("user quick links migration", () => {
  it("defines an owned, RLS-protected http/https link table", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260819060520_add_user_quick_links.sql"), "utf8");
    expect(sql).toContain("create table public.user_quick_links");
    expect(sql).toContain("url ~* '^https?://'");
    expect(sql).toContain("alter table public.user_quick_links enable row level security");
    expect(sql).toContain("using (user_id = auth.uid())");
    expect(sql).toContain("with check (user_id = auth.uid())");
  });
});
