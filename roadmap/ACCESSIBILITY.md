# Accessibility Review and Improvement Plan

This document reviews the accessibility of CLNDR's generated UI and proposes practical improvements. It focuses on the default template and the DOM integration layer, with examples that keep backward compatibility where possible.

## Summary

- Current markup relies on `div` for interactive controls and days; there is no keyboard support and minimal semantic structure.
- Screen readers receive little context about the current month/year, selected day, or disabled/adjacent days.
- Navigation relies on click/touch only; no arrow-key navigation within the date grid.

## Key Findings (with references)

- Non-interactive elements used as controls:
  - Previous/next are `div` elements instead of buttons in the default template (`src/ts/templates.ts:14`, `src/ts/templates.ts:16`).
- Day cells are generic containers:
  - The default template renders day cells as `<div class="...">` without ARIA (`src/ts/templates.ts:23-27`).
  - Day-specific classes (today, past, event, adjacent, selected) are emitted by core logic, not semantic attributes (`src/ts/core.ts:486-573`).
- Weekday headers use non-table markup:
  - Headers are `<div class="header-day">...` (no `<th>`/`scope`) in the shipped template (`src/ts/templates.ts:21`).
- No keyboard navigation:
  - The DOM layer wires `click` or `touchstart` only; there are no `keydown` handlers (`src/ts/dom.ts`).
- No explicit state semantics (ARIA):
  - Visual states are CSS class tokens only; not exposed via ARIA.
- No live announcement for month changes.
- Visual focus risk in CSS:
  - `outline: none;` is applied to a grid container in modern table mode (`src/css/clndr.css:349-350`), which can hide focus if interactive elements are added without explicit focus styles.

## Goals

- Make navigation controls keyboard and screen-reader friendly.
- Expose a semantically correct calendar that is navigable via keyboard.
- Convey state (today, selected, disabled, adjacent) via ARIA.
- Announce month changes to assistive tech.

## Minimal, Backward-Compatible Improvements (Quick Wins)

These changes improve a11y significantly without altering the core API or event wiring.

~~1. Use native buttons for controls~~

- ~~Replace navigation/control elements with `<button type="button">`.~~
- ~~Add accessible names: `aria-label="Previous month"`, `aria-label="Next month"`, etc.~~
- ~~Group controls in a `role="toolbar"` and ensure visible focus styles.~~

~~2. Add a live/labelled heading for the current period~~

- ~~Add a heading (e.g., `<h2 id="clndr-heading" aria-live="polite">November 2025</h2>`).~~
- ~~Reference it from the calendar container via `aria-labelledby`.~~

3. Prefer semantic structure for weekday headers and title

- If adopting a table-based template, add `<caption class="visually-hidden">Month Year calendar</caption>` and `<th scope="col">` for weekday headers.
- If retaining a `div`-grid, consider ARIA Grid semantics (`role="grid"`/`row`/`gridcell`) or promote weekday headers to headings.

4. Render days as buttons inside cells

- ~~Keep the existing day class on the clickable element for delegated events.~~
- ~~Use `<button class="day" type="button">` inside the cell container.~~
- ~~Add `data-date="YYYY-MM-DD"` and `aria-label="Wednesday, November 6, 2025"`.~~
- Reflect states as:
  - ~~Today: `aria-current="date"`~~
  - Selected: `aria-pressed="true"` or `aria-selected="true"`
  - ~~Inactive/Out-of-range: `aria-disabled="true"` (and disable click handler)~~

5. Keyboard basics without a grid refactor

- ~~With days as `button`s, users can Tab through days and Enter/Space to select.~~
- Add key handlers to support arrow navigation (see "Keyboard Navigation" below) while preserving click behavior.

## Example: Accessible Default Template (table-based)

This drops into `template` usage or can guide a future default template update. It keeps selectors and classes so current delegated events continue working.

```html
<div class="clndr" aria-labelledby="clndr-heading">
  <div class="clndr-controls" role="toolbar">
    <button class="clndr-previous-year-button" type="button" aria-label="Previous year">&laquo;</button>
    <button class="clndr-previous-button" type="button" aria-label="Previous month">&lsaquo;</button>
    <h2 id="clndr-heading" class="month" aria-live="polite"><%= month %> <%= year %></h2>
    <button class="clndr-next-button" type="button" aria-label="Next month">&rsaquo;</button>
    <button class="clndr-next-year-button" type="button" aria-label="Next year">&raquo;</button>
    <button class="clndr-today-button" type="button" aria-label="Go to today">Today</button>
  </div>

  <table class="clndr-table" border="0" cellspacing="0" cellpadding="0">
    <caption class="visually-hidden"><%= month %> <%= year %> calendar</caption>
    <thead>
      <tr class="header-days">
        <% for (var i = 0; i < daysOfTheWeek.length; i++) { %>
          <th class="header-day" scope="col"><%= daysOfTheWeek[i] %></th>
        <% } %>
      </tr>
    </thead>
    <tbody>
      <% for (var i = 0; i < numberOfRows; i++) { %>
        <tr>
          <% for (var j = 0; j < 7; j++) { %>
            <% var d = j + i * 7; var day = days[d]; %>
            <td>
              <% if (day) { %>
                <button
                  type="button"
                  class="<%= day.classes %>"
                  data-date="<%= day.date ? day.date.toString().slice(0,10) : '' %>"
                  aria-label="<%= day.date ? day.date.toString() : '' %>"
                  <%= day.properties && day.properties.isInactive ? 'aria-disabled="true"' : '' %>
                  <%= day.properties && day.properties.isToday ? 'aria-current="date"' : '' %>
                >
                  <%= day.day %>
                </button>
              <% } else { %>
                <div class="empty"></div>
              <% } %>
            </td>
          <% } %>
        </tr>
      <% } %>
    </tbody>
  </table>
</div>
```

Notes

- This leverages current CSS tokens like `calendar-day-YYYY-MM-DD` and the `.day` target selector.
- For a full WAI-ARIA Grid pattern, consider `role="grid"` with roving tabindex or `aria-activedescendant`. The above is a pragmatic step that improves keyboarding with minimal changes.

## ARIA State Mapping

- Today → `aria-current="date"`
- Selected → `aria-selected="true"` (or `aria-pressed="true"` if using toggle buttons)
- Inactive/Out-of-range → `aria-disabled="true"`
- Adjacent month days → include in tab order but consider `aria-disabled="true"` when they should not be selectable (depends on `adjacentDaysChangeMonth`).

## Announcements

- Apply `aria-live="polite"` to the month heading or provide a visually hidden live region and update it on month/year changes. This helps screen readers announce the new visible month after navigation.

## Color and Contrast

- Ensure selected/hover/today states meet WCAG 2.2 AA contrast.
- Do not rely solely on color: add non-color cues such as underline, border, or icon.

## Testing Recommendations

- Add automated checks with `jest-axe` or `@axe-core/dom` against the default template:
  - No buttons without labels.
  - No interactive elements that are not focusable.
  - If using the table-based template: proper `<th scope="col">` headers and a caption.
  - No `aria-*` attribute misuse.
- Include keyboard navigation tests (arrow keys, Home/End, PageUp/PageDown) for basic behavior.
- Leverage Storybook's a11y addon already configured in this repo (`.storybook/main.ts`) to spot regressions interactively.

## Longer-Term Enhancements

- Provide a first-class, accessible default template as an option (e.g., `template: DEFAULT_A11Y_TEMPLATE`).
- Consider a Grid pattern: `role="grid"`, `role="row"`, `role="gridcell"`, with roving tabindex and `aria-activedescendant`.
- Add options to customize labels (e.g., `labels.previousMonth`, `labels.nextMonth`, `labels.today`).
- Expose selected range semantics if range selection is added later (`aria-multiselectable`).

## Implementation Checklist

- Controls are `<button type="button">` with clear labels.
- Calendar container has a programmatic name (`aria-labelledby`) and month heading has `aria-live="polite"`.
- Weekday headers use `<th scope="col">` (when table-based) or appropriate roles (when grid-based).
- Day cells contain focusable controls with `data-date` and ARIA states.
- Keyboard navigation added for arrows/home/end/page up/down.
- Focus is preserved or moved predictably after month changes.
- Visual focus indicator is visible for all interactive elements.

## Non-Goals (for this pass)

- Changing public API or event payloads.
- Rewriting to a full ARIA Grid with `aria-activedescendant` (good future candidate).

---

If you want, I can: (a) switch the built-in template to the accessible version, (b) add the keyboard handler scaffold in `src/ts/dom.ts`, and/or (c) add a minimal `jest-axe` suite to prevent future regressions.

## A11y Roadmap

This section tracks the phased plan for delivering the accessibility improvements outlined above. It mirrors the standalone roadmap and is provided here for a single-source reference.

### Phase 1 - Quick Wins (BC-Friendly)

- ~~Replace navigation/today controls with `<button type="button">` and clear `aria-label`s; ensure visible focus styles.~~
- ~~Add a heading for the current period and reference it from the calendar container via `aria-labelledby`; announce updates with `aria-live="polite"`.~~
- Use `<th scope="col">` for weekday headers (table-based) and add a visually hidden `<caption>`.
- Render days as buttons inside cells with `data-date` and localized `aria-label`s; reflect states with `aria-current="date"`, `aria-pressed`/`aria-selected`, and `aria-disabled`.
- ~~Toggle `disabled`/`aria-disabled` on constrained navigation in `applyConstraintClasses()`.~~
- ~~Preserve existing class tokens/selectors for backward compatibility.~~

Implementation targets: `src/ts/templates.ts`, `src/ts/dom.ts`, `src/css/clndr.css`.

### Phase 2 - Keyboard Navigation & Focus

- Add delegated `keydown` handlers for `.day` supporting Arrow, Home/End, PageUp/PageDown; prevent default scrolling for handled keys.
- After render, focus the selected day; otherwise focus the first focusable day.
- Optional: roving tabindex (`tabindex=0` for the focused day, `-1` for others).

Implementation targets: `src/ts/dom.ts`, `src/ts/core.ts`, tests in `tests/jest`.

### Phase 3 - Semantics Options & I18n

- Optional ARIA Grid mode (`role="grid"`/`row`/`gridcell`) as a configuration.
- Localized labels for navigation and day `aria-label` formatting.
- Prefer `data-date` for programmatic lookups while keeping `calendar-day-YYYY-MM-DD` for compatibility.

### Non-Goals (For Now)

- Do not remove existing CSS class tokens relied upon by consumers.
- Do not require ARIA Grid semantics; keep table-based as default.

### Testing & Docs

- DOM event tests for keyboard navigation and disabled navigation.
- Rendering tests for ARIA attributes, heading, caption.
- README updates summarizing accessibility features and options.

### Work Items (Checklist)

- ~~[x] Update default template semantics (`src/ts/templates.ts`).~~
- [ ] Add `data-date` and ARIA state reflection on days.
- ~~[x] Toggle `disabled`/`aria-disabled` for constrained navigation.~~
- [ ] Add keyboard handlers and focus management (`src/ts/dom.ts`).
- ~~[x] Add visible focus styles and a `visually-hidden` helper (`src/css/clndr.css`).~~
- [ ] Add Jest tests for keyboard and ARIA rendering.
- [ ] Update README with accessibility guidance.

### Open Questions

- `aria-selected` vs `aria-pressed` for day selection when using buttons.
- Focus wrapping across months vs clamping per rendered block.
- Whether navigating to "Today" should also move focus.
