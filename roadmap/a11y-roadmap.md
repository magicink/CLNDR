# Accessibility Roadmap (A11y)

This document captures concrete UI accessibility gaps in CLNDR's default markup and DOM layer, and proposes incremental, backward-compatible steps to address them.

Related reference: see `roadmap/ACCESSIBILITY.md` for detailed rationale, sample template, and example key handling.

## Current Gaps (Code-Based)

- Non-interactive elements used as controls
  - Navigation and today controls are rendered as `div`/`span` instead of native buttons.
  - Affected: `src/ts/templates.ts` (DEFAULT_TEMPLATE), `tests/test.html` templates.
- Day cells rendered as generic containers
  - Days are `div` inside `<td>` (or just `div` in grid templates) with no semantic control, no focusability, and no programmatic value.
  - Affected: `src/ts/templates.ts` (DEFAULT_TEMPLATE), `tests/test.html` templates.
- Weekday headers lack table semantics
  - Headers use `<td>` rather than `<th scope="col">`.
  - Affected: `src/ts/templates.ts` (DEFAULT_TEMPLATE), `tests/test.html` templates.
- No keyboard navigation support
  - The DOM layer only binds `click`/`touchstart`; arrow keys, Home/End, PageUp/PageDown are not handled.
  - Affected: `src/ts/dom.ts` (bindEvents only binds mouse/touch).
- No state semantics (screen readers)
  - State is expressed by CSS classes only; no ARIA state tokens for today/selected/inactive/adjacent.
  - Affected: `src/ts/core.ts` (builds classes + properties), consumed in templates.
- No live announcement for month changes
  - Month/year changes are not announced via `aria-live`.
  - Affected: templates + DOM layer when re-rendering.
- Constraints not reflected as disabled controls
  - `applyConstraintClasses()` toggles a visual `inactive` class but does not set `disabled`/`aria-disabled` on controls.
  - Affected: `src/ts/dom.ts` (applyConstraintClasses).
- Focus management is absent
  - Re-renders may dump focus; there is no rule to place focus on the selected/first day.
  - Affected: `src/ts/dom.ts` (render/applyChange), templates.
- No machine-readable date on day elements
  - Dates are encoded only in class names (`calendar-day-YYYY-MM-DD`); no `data-date` attribute for accessible navigation and focus movement.
  - Affected: `src/ts/core.ts` (class construction), all templates.

## Goals

- Make controls and days keyboard- and screen-reader-friendly with minimal API changes.
- Convey selection, today, and inactive states through ARIA semantics in addition to CSS.
- Provide basic arrow-key navigation within the calendar grid.
- Announce month changes without extra work by consumers.

## Phase 1 - Quick Wins (BC-Friendly)

- Controls: use native buttons
  - Default template: render nav/today as `<button type="button">` with `aria-label`.
  - Add visible focus styles in CSS; ensure focus is not suppressed.
- Heading and live announcements
  - Add a heading for the current period (for example, `<h2 id="clndr-heading" aria-live="polite">Month YYYY</h2>`), and reference it via `aria-labelledby` on the container.
- Table semantics for headers
  - Use `<th scope="col">` for weekday headers; add a visually-hidden `<caption>` describing the calendar.
- Day elements as buttons
  - Render days as `<button class="day ..." type="button">` within each cell.
  - Add `data-date="YYYY-MM-DD"` and a speakable `aria-label` (localized), for example: "Wednesday, November 6, 2025".
  - Reflect states:
    - Today: `aria-current="date"`
    - Selected: `aria-pressed="true"` or `aria-selected="true"`
    - Inactive/Out-of-range: `aria-disabled="true"` and suppress click.
- Constraints -> disabled controls
  - In `applyConstraintClasses()`, set `disabled` and `aria-disabled="true"` on nav buttons when constraints disable movement.
- Keep BC with current selectors
  - Preserve existing class tokens (for example, `calendar-day-YYYY-MM-DD`, `.day`, nav control classes) so delegated events and tests continue working.

Implementation targets

- `src/ts/templates.ts`: Update `DEFAULT_TEMPLATE` with the above semantics and attributes.
- `src/ts/dom.ts`: Enhance `applyConstraintClasses()` to toggle `disabled`/`aria-disabled` on nav buttons.
- `src/css/clndr.css`: Ensure visible focus styles for `.day` and nav buttons; add an `.sr-only` utility.

## Phase 2 - Keyboard Navigation & Focus

- Delegated key handling on days
  - On `keydown` for `.day`:
    - ArrowLeft/Right: move focus +/- 1 day.
    - ArrowUp/Down: move focus +/- 7 days.
    - Home/End: jump to start/end of week.
    - PageUp/PageDown: change month (or interval) via existing navigation handlers.
    - Prevent default scrolling for handled keys.
- Focus management on render
  - After re-render, focus the selected day; if none, focus the first focusable day in view.
- Optional roving tabindex pattern
  - Consider `tabindex="0"` on the focused day and `tabindex="-1"` on others for dense grids. Using native `<button>` for all days is acceptable as a simpler baseline.

Implementation targets

- `src/ts/dom.ts`: Add delegated `keydown` binding alongside click/touch, plus post-render focus placement.
- `src/ts/core.ts`: Continue emitting classes; also consider exposing an `isSelected` flag in `day.properties` to simplify ARIA application in templates.
- `tests/jest`: Add keyboard navigation tests (focus movement, month paging, and ARIA attributes on days/nav).

## Phase 3 - Semantics Options & I18n

- Optional ARIA grid mode
  - Add an option to render with `role="grid"`/`row`/`gridcell` semantics instead of table, if desired by consumers.
- Localized labels
  - Add options for customizing nav button labels and day `aria-label` format, leveraging `locale` from the adapter.
- Data attribute for dates (forward-looking)
  - Prefer `data-date` for programmatic lookups in `dom.ts` while keeping the `calendar-day-YYYY-MM-DD` class for backward compatibility. Consider deprecating reliance on class parsing in a future major.

## Non-Goals (For Now)

- Removing existing CSS class tokens used by consumers.
- Forcing a switch to ARIA grid semantics; keep table-based as default.

## Testing & Docs

- Unit tests
  - DOM events: keyboard navigation and disabled nav buttons.
  - Rendering: `aria-*` attributes on days and controls; presence of heading/caption.
- Documentation
  - Expand README with an "Accessibility" section summarizing supported features and options.

## Work Items (Checklist)

- [ ] Update DEFAULT_TEMPLATE with buttons, headers, caption, and ARIA attributes (`src/ts/templates.ts`).
- [ ] Add `data-date` to day elements; keep `calendar-day-YYYY-MM-DD` class for backward compatibility.
- [ ] Toggle `disabled`/`aria-disabled` for constrained nav (`src/ts/dom.ts` `applyConstraintClasses`).
- [ ] Add delegated keydown handlers for `.day` and focus management (`src/ts/dom.ts`).
- [ ] Add visible focus styles and `.sr-only` helper (`src/css/clndr.css`).
- [ ] Add Jest tests for keyboard navigation and ARIA state rendering (`tests/jest/...`).
- [ ] Update README with accessibility guidance and link to `roadmap/ACCESSIBILITY.md`.

## Open Questions

- Should selection use `aria-selected` (table/grid pattern) or `aria-pressed` (toggle-button pattern) for day buttons?
  - Proposal: `aria-pressed` for button-based days, `aria-selected` if adopting ARIA grid.
- For multi-month views, should focus wrap across months or clamp per rendered block?
  - Proposal: wrap logically by date.
- Should "today" move focus on navigation, or only on explicit "Today" action?
  - Proposal: maintain focus on the previously focused date when possible; the Today action moves focus to today.
