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

### Project checklist

- Structure: compact add form, completion summary, sortable list rows, optional due-date status, and destructive completed-item cleanup.
- States: empty, populated, completed, hidden-completed, editing, dragging, pending, success, and error.
- Responsive behavior: fine-pointer desktop uses a drag handle; up/down controls remain available for keyboard and touch users, with 44px targets on mobile.
- Accessibility: native checkboxes and date inputs, labelled icon actions, status text in addition to color, and keyboard submission with Enter.

### Project reservation

- Structure: section heading with count and add command, compact reservation cards, and one labelled modal form for create or edit. Date and time fields adapt to the selected reservation type and support a distinct end date.
- States: empty, populated, creating, editing, saving, linked-calendar, unlinked, delete-choice, success, and error.
- Responsive behavior: cards use two columns on wide screens and one column on mobile; the four-part period fields use one column on mobile, and the modal owns one scrollable body with actions reachable above the safe area.
- Accessibility: reservation type and calendar-sync controls have visible labels, icon actions include names, and linked-calendar status is expressed with text as well as an icon.
- Data compatibility: legacy reservations with no end date are displayed as same-day reservations. New saves synchronize the explicit reservation end date to the linked Calendar event.

### Project budget

- Structure: one compact budget summary, optional total-budget editor, filter controls, and two-line expense rows with reservation linkage.
- States: budget-unset, budget-set, under-budget, over-budget, empty-expenses, filtered-empty, creating, editing, pending, paid, linked-reservation, success, and error.
- Responsive behavior: summary metrics form a restrained desktop grid and a stacked mobile list; expense rows keep the title and amount readable without forcing every field onto one line.
- Accessibility: amount inputs have explicit currency context, status changes use labelled buttons, filters expose their selected state, and destructive actions require confirmation.

### Project workspace

- Structure: one project summary header, a contextual tab list, and overview, schedule, checklist, reservation, budget, notes, files, and map panels. Tab priority follows the project's existing preset identity; ambiguous projects retain the default order. Low-frequency desktop tabs use the existing compact popover pattern without changing their hash or panel.
- States: overview-default, active-tab, overflow-open, overflow-tab-active, empty-summary, populated-summary, and hash-restored tab.
- Responsive behavior: desktop keeps priority tabs and a compact overflow command in one row; mobile uses the same contextual priority in a touch-sized horizontal strip without causing page-level overflow.
- Accessibility: semantic tabs and tabpanels, keyboard arrow navigation, keyboard-operable overflow menu, visible focus, selected text treatment in addition to color, and text labels alongside project color.
- Persistence: the selected tab is stored in the URL hash so refresh keeps context without triggering a new server fetch.
- Data loading: contextual ordering never changes panel mounting or cache rules. Notes, files, and map still mount only on first activation and remain mounted afterward.

### Workspace action-first empty state

- Structure: a concise empty-state heading, one primary command, and project-type recommendations that seed an existing form without saving.
- States: empty, recommendation-hover, recommendation-focus, recommendation-selected-in-form, batch-pending, success, and error.
- Responsive behavior: recommendations wrap into compact desktop rows and a two-column mobile grid with 44px touch targets.
- Accessibility: recommendations are named buttons with Lucide icons; status text accompanies pending and batch results.
- Data boundary: recommendations only prefill existing event, checklist, or reservation fields. No record is created until the user explicitly saves or selects `모두 추가`.

### Project creation form

- Structure: project name first, optional quick-start cards, project type, representative icon and color controls, a compact live preview, optional details, and one primary start command.
- States: empty-name, quick-start selected, type customized, icon list expanded, color selected, preview-updated, details-collapsed, editing, pending, success, and error.
- Responsive behavior: desktop keeps quick-start cards in one compact row when space permits; mobile uses two columns without page-level overflow and preserves 44px touch targets.
- Accessibility: native fieldset labels, `aria-pressed` selection state, visible check marks alongside color and border changes, named icon controls, and visible keyboard focus.
- Motion: selection and press feedback uses the shared 120ms transform/opacity micro interaction. The form does not animate layout dimensions.
- Data boundary: quick starts are UI-only presets for existing project fields. They never create additional records or change the project schema.

### Project notes workspace

- Structure: a searchable note list and a direct editor with title, Markdown Lite body, pin, save, preview, and delete commands.
- States: first-load, empty, filtered-empty, selected, new-draft, editing, previewing, saving, saved, deleting, and error.
- Responsive behavior: desktop uses a two-pane list/editor workspace without a modal; mobile shows the list first and changes to a full-width editor after selection, with a touch-sized back command.
- Accessibility: semantic search and form labels, text names for icon commands, 44px touch targets, title Enter save, body Ctrl/Cmd+Enter save, Escape cancel, visible focus, and status/alert feedback.
- Data loading: the notes panel fetches only on its first mount. Tab changes keep the mounted notes component and reuse its local cache.
- Markdown Lite: headings, unordered and ordered list lines, task list lines, and line breaks render as React text nodes. HTML, tables, images, attachments, and code blocks are not interpreted.

### Project files workspace

- Structure: a searchable and sortable file list with multi-file upload and a selected-file preview pane. Files use a private Storage bucket; preview and download commands receive short-lived signed URLs.
- States: first-load, empty, filtered-empty, drag-over, uploading, selected, preview-loading, preview-ready, preview-error, deleting, success, and error.
- Responsive behavior: desktop uses a two-pane list/preview workspace; mobile shows the list first and changes to a full-width preview after selection, with a touch-sized back command.
- Accessibility: semantic search and sort controls, a keyboard-accessible file picker as the drag-and-drop alternative, named file rows and actions, visible focus, and 44px touch targets.
- Preview policy: image and text files render in the preview pane; PDF uses a signed new-tab preview; Office documents show file information and download guidance without implying browser rendering support.
- Data loading: the files panel fetches only on its first mount. Tab changes keep the mounted component and reuse its local cache.

### Project map workspace

- Structure: a project-wide map tab with date and visit-status filters, numbered pins, a matching ordered list, and one place editor. The map and list share the same filtered order so pin numbers remain stable.
- States: empty, searching, provider-unconfigured, map, list, selected-place, no-coordinate, editing, dragging, visited, and post-project summary.
- Responsive behavior: desktop keeps map and route list side by side; mobile switches between full-width map and list with a segmented control and uses explicit up/down ordering controls.
- Accessibility: every map action has a text or accessible name, list ordering remains operable without drag, visit state is expressed with text, and no GPS permission is requested.
- Data boundary: only user-confirmed places are stored. Existing events and reservations never create places merely by being read.

### Travel workspace today

- Structure: a compact travel identity band followed by time-ordered today events, the next event, due-today checklist items, today's reservation-linked spending, reservation quick actions, linked files, and a one-field quick note.
- States: before-trip D-day, active trip day, trip-ended, free-day, scheduled, no-checklist, no-reservation, no-linked-file, saving-note, saved-note, copy-success, and action-error.
- Responsive behavior: desktop uses a restrained two-column dashboard; mobile keeps the travel identity and next actions first, uses one column, and gives every action a 44px touch target without page-level overflow.
- Accessibility: real links for maps, telephone, and websites; labelled copy and file commands; live status for clipboard, signed-file, and note results; text labels accompany all icons.
- Data loading: existing project events, checklist, reservations, expenses, notes, and files are reused. Travel Today does not refetch tab data, and reservation-linked file metadata seeds the Files panel cache.

## 6. Motion & Interaction

- Micro interaction: 120ms ease-out, matching shared buttons.
- Standard panel/tab changes: 200ms ease-in-out where already present.
- Only transform and opacity are animated. Filtered results update without decorative motion.
- `prefers-reduced-motion` is respected by the global stylesheet.

## 7. Depth & Surface

BOGUNON uses a mixed but restrained strategy: tonal surface shifts and `--line` borders define most hierarchy, `--shadow-sm` supports cards, and `--shadow-panel` is reserved for drawers. NEIS rows use dividers and state tints rather than additional elevation.
