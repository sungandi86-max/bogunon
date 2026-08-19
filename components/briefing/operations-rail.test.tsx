import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Today operations rail composition", () => {
  it("does not import or render the Today weather card", () => {
    const source = readFileSync(resolve(process.cwd(), "components/briefing/operations-rail.tsx"), "utf8");
    expect(source).not.toContain("WeatherCard");
    expect(source).toContain("AedSummaryCard");
  });
});
