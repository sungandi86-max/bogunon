import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve(process.cwd(), "styles/responsive.css"),
  "utf8",
);
const screenStylesheet = readFileSync(
  resolve(process.cwd(), "styles/screens.css"),
  "utf8",
);

describe("responsive home calendar layout", () => {
  it("releases the desktop viewport height on mobile", () => {
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.month-overview \.full-calendar\s*\{[^}]*height:\s*auto;/,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.calendar-page\s*\{[^}]*padding-bottom:\s*calc\(var\(--mobile-nav-height\) \+ var\(--space-10\) \+ env\(safe-area-inset-bottom\)\);/,
    );
  });

  it("keeps the calendar page below the fixed account header while preserving desktop schedule density", () => {
    expect(screenStylesheet).toMatch(
      /\.calendar-page \.page-canvas\s*\{[^}]*padding-top:\s*calc\(var\(--app-header-height\) \+ var\(--space-6\)\);/,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.calendar-page \.page-canvas\s*\{[^}]*padding-top:\s*calc\(var\(--app-header-height\) \+ var\(--space-2\)\);/,
    );
    expect(screenStylesheet).toMatch(
      /\.full-calendar\s*\{[^}]*height:\s*max\(560px, calc\(100dvh - var\(--app-header-height\) - 292px\)\);/,
    );
    expect(screenStylesheet).toMatch(
      /\.calendar-detail-panel\s*\{[^}]*height:\s*max\(560px, calc\(100dvh - var\(--app-header-height\) - 292px\)\);/,
    );
  });
});
