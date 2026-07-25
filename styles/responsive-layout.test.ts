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

  it("keeps the mobile create action clear of the bottom navigation", () => {
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.mobile-create-fab\s*\{[^}]*bottom:\s*calc\(var\(--mobile-nav-bottom\) \+ var\(--mobile-nav-height\) \+ var\(--space-8\) \+ var\(--space-5\) \+ env\(safe-area-inset-bottom\)\);[^}]*position:\s*fixed;[^}]*right:\s*var\(--space-8\);/,
    );
  });

  it("uses compact mobile title summaries instead of desktop stickers", () => {
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.full-calendar__mobile-summary\s*\{[^}]*display:\s*grid;/,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.full-calendar__event-list \.calendar-cell-items,\s*\.full-calendar__event-list \.calendar-overflow\s*\{[^}]*display:\s*none;/,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.full-calendar__mobile-title\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/,
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

  it("keeps Korean words intact in the mobile AI writer notice", () => {
    expect(screenStylesheet).toMatch(
      /@media\s*\(max-width:\s*1023px\)[\s\S]*?\.ai-writer-desktop-only p\s*\{[^}]*word-break:\s*keep-all;/,
    );
  });
});

describe("responsive admin notices layout", () => {
  it("gives the editor 65 percent of the desktop workspace", () => {
    expect(screenStylesheet).toMatch(
      /\.admin-notices\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*13fr\)\s+minmax\(0,\s*7fr\);/,
    );
  });

  it("stacks the editor and notice list on tablet and mobile", () => {
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*1023px\)[\s\S]*?\.admin-notices\s*\{[^}]*grid-template-columns:\s*1fr;/,
    );
  });
});
