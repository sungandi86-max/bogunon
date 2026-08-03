import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CALENDAR_STICKER_CATALOG } from "@/lib/calendar-stickers/catalog";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260803110000_unify_timed_calendar_stickers.sql"),
  "utf8",
);

describe("timed calendar sticker migration", () => {
  it("adds sticker identity to Event and migrates legacy rows as all-day events", () => {
    expect(migration).toContain("add column if not exists sticker_key text");
    expect(migration).toContain("from public.calendar_stickers sticker");
    expect(migration).toContain("coalesce(sticker.end_date, sticker.sticker_date)");
    expect(migration).toContain("true,");
    expect(migration).toContain("delete from public.calendar_stickers sticker");
  });

  it("persists sticker_key through the shared Event bundle function", () => {
    expect(migration).toContain("sticker_key = nullif(p_values->>'sticker_key', '')");
    expect(migration).toContain("event_details, sticker_key,");
  });

  it("closes legacy writes and protects sticker and exercise event integrity", () => {
    expect(migration).toContain("events_sticker_key_format_check");
    for (const sticker of CALENDAR_STICKER_CATALOG) {
      expect(migration).toContain(`'${sticker.key}'`);
    }
    expect(migration).toContain("revoke insert, update on table public.calendar_stickers from authenticated");
    expect(migration).toContain("protect_linked_exercise_event_shape");
    expect(migration).toContain("before update of event_type, sticker_key on public.events");
  });
});
