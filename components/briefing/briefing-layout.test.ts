import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const screenStyles = readFileSync(resolve(process.cwd(), "styles/screens.css"), "utf8");
const responsiveStyles = readFileSync(resolve(process.cwd(), "styles/responsive.css"), "utf8");

describe("Today calendar-first layout", () => {
  it("reserves roughly three quarters of the desktop workspace for the calendar", () => {
    expect(screenStyles).toContain(
      ".operations-dashboard { gap: var(--space-8); grid-template-columns: minmax(0, 3fr) minmax(248px, 1fr); }",
    );
    expect(screenStyles).toContain(
      ".operations-rail { align-self: start; background: transparent; border: 0; border-radius: 0; box-shadow: none; display: grid; gap: var(--space-6); overflow: visible; }",
    );
    expect(screenStyles).toContain(".operations-rail > section, .operations-rail > details { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: var(--space-8); }");
  });

  it("moves the information rail below the calendar on tablet and keeps one mobile column", () => {
    expect(responsiveStyles).toContain("@media (min-width: 768px) and (max-width: 1199px)");
    expect(responsiveStyles).toContain(".operations-dashboard { grid-template-columns: minmax(0, 1fr); }");
    expect(responsiveStyles).toContain(".operations-rail { grid-template-columns: repeat(2, minmax(0, 1fr)); }");
    expect(responsiveStyles).toContain(
      ".operations-rail { display: grid; gap: var(--space-4); grid-template-columns: minmax(0, 1fr); margin-top: var(--space-6); }",
    );
  });
});
