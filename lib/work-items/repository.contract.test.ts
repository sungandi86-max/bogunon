import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repository = readFileSync(join(process.cwd(), "lib/work-items/repository.ts"), "utf8");

describe("recurring sticker event contract", () => {
  it("preserves sticker identity on generated occurrences", () => {
    expect(repository).toContain("sticker_key: root.sticker_key ?? null");
  });
});
