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
  <!-- Removed table-element-centric note about weekday headers -->
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

<!-- Removed table-element guidance for weekday headers -->

<!-- Removed outdated example template section -->

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

Implementation targets: `src/ts/templates.ts`, `src/ts/dom.ts`, `src/css/clndr.css`.

### Phase 2 - Keyboard Navigation & Focus

- After render, focus the selected day; otherwise focus the first focusable day.
- Optional: roving tabindex (`tabindex=0` for the focused day, `-1` for others).

Implementation targets: `src/ts/dom.ts`, `src/ts/core.ts`, tests in `tests/jest`.

### Phase 3 - Semantics Options & I18n

- Optional ARIA Grid mode (`role="grid"`/`row`/`gridcell`) as a configuration.
- Localized labels for navigation and day `aria-label` formatting.
- Prefer `data-date` for programmatic lookups while keeping `calendar-day-YYYY-MM-DD` for compatibility.

### Non-Goals (For Now)

- Do not remove existing CSS class tokens relied upon by consumers.
- Do not require ARIA Grid semantics.

### Testing & Docs

- DOM event tests for keyboard navigation and disabled navigation.
- Rendering tests for ARIA attributes and the live heading.
- README updates summarizing accessibility features and options.

### Work Items (Checklist)

- [ ] Add keyboard handlers and focus management (`src/ts/dom.ts`).
- [ ] Add Jest tests for keyboard and ARIA rendering.
- [ ] Update README with accessibility guidance.

### Open Questions

- `aria-selected` vs `aria-pressed` for day selection when using buttons.
- Focus wrapping across months vs clamping per rendered block.
- Whether navigating to "Today" should also move focus.
