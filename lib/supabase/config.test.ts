import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("Supabase public configuration", () => {
  it("uses statically analyzable NEXT_PUBLIC environment access for the browser bundle", () => {
    const source = readFileSync("lib/supabase/config.ts", "utf8");

    expect(source).toContain("process.env.NEXT_PUBLIC_SUPABASE_URL");
    expect(source).toContain("process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(source).not.toMatch(/process\.env\[["']NEXT_PUBLIC_/);
  });
});
