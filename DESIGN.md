# BOGUNON Design System

## 1. Atmosphere & Identity

BOGUNON is a calm, practical school-health workspace. Its signature is a soft mint canvas with quiet white surfaces, compact Korean typography, and restrained status color that makes dense schedules readable without feeling clinical.

## 2. Color

All product colors come from `styles/foundation.css`.

| Role | Token | Usage |
|---|---|---|
| Canvas | `--canvas-cool`, `--canvas-warm` | App background |
| Surface | `--surface`, `--surface-subtle` | Cards, drawers, grouped controls |
| Text | `--ink-950`, `--ink-700`, `--ink-500` | Primary, secondary, muted text |
| Border | `--line-strong`, `--line`, `--line-subtle` | Inputs, panels, dividers |
| Action | `--action-700`, `--action-600`, `--action-500`, `--action-100`, `--action-50` | Primary actions, selection, focus |
| Status | `--success`, `--warning`, `--danger`, `--info` and `*-soft` | Result and validation states |
| School | `--school`, `--school-soft` | Academic schedule context |

Accent color communicates interaction or status. New colors must first be added to `styles/foundation.css`; gradients and decorative color are not part of the operational UI.

## 3. Typography

- Primary: `--font-family-sans` (Pretendard with Korean system fallbacks).
- Page title: `--text-page`, bold, `--leading-heading`.
- Card title: `--text-card`, bold.
- Section title: `--text-section`, semibold.
- Body: `--text-body` / `--text-base`, regular.
- Supporting text: `--text-support`, `--text-meta`, and `--text-sm`.
- Numeric summaries use `font-variant-numeric: tabular-nums` when alignment matters.

## 4. Spacing & Layout

- Spacing uses the existing `--space-1` through `--space-20` scale in `styles/foundation.css`.
- Controls use `--control-sm`, `--control-md`, `--control-lg`, and `--touch-target`.
- Corners use `--radius-sm`, `--radius-md`, `--radius-lg`, or `--radius-xl`; pills use `--radius-full` only for compact toggles.
- Desktop app content accounts for `--sidebar-width`; mobile layout accounts for `--mobile-header-height`, `--mobile-nav-height`, and safe-area insets.
- Drawers own one scrolling body. Headers and action footers remain stable; nested content should not create a second page-height scroll region.

## 5. Components

### Button

- Structure: semantic `button` through `components/ui/button.tsx`.
- Variants: primary, secondary, ghost, danger, icon-only.
- States: hover, pressed, focus-visible, disabled, and pending copy.
- Accessibility: visible focus ring, native disabled state, minimum mobile touch target.

### Badge

- Structure: compact text badge through `components/ui/badge.tsx`.
- Variants: neutral, school, waiting, check, success, and domain tones.
- States: badges are informational and never the sole indicator of selection.

### Detail drawer

- Structure: overlay, labelled header, one scrollable body, optional persistent footer.
- States: loading, empty, error, populated, saving.
- Accessibility: dialog semantics, labelled title, close control, escape/backdrop dismissal, keyboard focus support.

### Segmented filter

- Structure: a labelled group of buttons using the existing quiet border and mint selected state.
- States: default, hover, `aria-pressed` selected, focus-visible, disabled.
- Responsive behavior: wrapping or horizontal overflow inside the control only, never page-level horizontal scroll.

### Schedule preview row

- Structure: checkbox, date/title hierarchy, grade badge, type/status badges, clamped detail.
- States: new, duplicate, changed, selected, disabled duplicate.
- Accessibility: full row label targets the checkbox; status is expressed with text as well as color.

## 6. Motion & Interaction

- Micro interaction: 120ms ease-out, matching shared buttons.
- Standard panel/tab changes: 200ms ease-in-out where already present.
- Only transform and opacity are animated. Filtered results update without decorative motion.
- `prefers-reduced-motion` is respected by the global stylesheet.

## 7. Depth & Surface

BOGUNON uses a mixed but restrained strategy: tonal surface shifts and `--line` borders define most hierarchy, `--shadow-sm` supports cards, and `--shadow-panel` is reserved for drawers. NEIS rows use dividers and state tints rather than additional elevation.
