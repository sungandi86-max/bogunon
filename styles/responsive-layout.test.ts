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
  it("keeps the desktop Today rail narrow so the month calendar owns the page", () => {
    expect(screenStylesheet).toMatch(
      /\.operations-dashboard\s*\{[^}]*gap:\s*var\(--space-6\);[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+clamp\(296px,\s*21vw,\s*336px\);/,
    );
    expect(screenStylesheet).toMatch(
      /\.operations-rail\s*\{[^}]*gap:\s*var\(--space-5\);/,
    );
    expect(screenStylesheet).toMatch(
      /\.operations-rail\s*>\s*:is\(section,\s*details\)\s*\{[^}]*padding:\s*var\(--space-6\);/,
    );
  });

  it("caps meal content and keeps compact rail controls readable", () => {
    expect(screenStylesheet).toMatch(
      /\.meal-menu\s*\{[^}]*max-height:\s*calc\(var\(--space-20\)\s*\+\s*var\(--space-20\)\s*\+\s*var\(--space-20\)\);[^}]*overflow-y:\s*auto;/,
    );
    expect(screenStylesheet).toMatch(
      /\.quick-note\s*>\s*p[^}]*margin:\s*0\s+0\s+var\(--space-3\);/,
    );
    expect(screenStylesheet).toMatch(
      /\.school-info-card summary\s*\{[^}]*padding:\s*var\(--space-6\);/,
    );
  });

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

  it("uses one short mobile title summary instead of desktop stickers", () => {
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.full-calendar__mobile-summary\s*\{[^}]*display:\s*flex;/,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.full-calendar__event-list \.calendar-cell-items,\s*\.full-calendar__event-list \.calendar-overflow\s*\{[^}]*display:\s*none;/,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.full-calendar__mobile-title\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/,
    );
  });

  it("removes Smart Calendar and the mobile view switch from the calendar surface", () => {
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.calendar-page \.page-header__actions > a\[href="\/calendar\/generator"\]\s*\{[^}]*display:\s*none;/,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*?\.calendar-view-switch--mobile\s*\{[^}]*display:\s*none;/,
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
