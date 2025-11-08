# Accessibility Review and Improvement Plan

This document reviews the accessibility of CLNDR’s generated UI and proposes practical improvements. It focuses on the default template and the DOM integration layer, with examples that keep backward compatibility where possible.

## Summary

- Current markup relies on `div`/`span` for interactive controls and days; there is no keyboard support and minimal semantic structure.
- Screen readers receive little context about the current month/year, selected day, or disabled/adjacent days.
- Navigation relies on click/touch only; no arrow-key navigation within the date grid.

## Key Findings (with references)

- Non-interactive elements used as controls:
  - Previous/next are `span`/`div` elements instead of buttons (e.g., `src/ts/templates.ts:16`, `src/ts/templates.ts:20`; `tests/test.html:274`, `tests/test.html:278`).
- Day cells are generic containers:
  - Default template renders day cells without controls or ARIA (e.g., `src/ts/templates.ts:36`).
  - Demo templates render days as `div` elements (e.g., `tests/test.html:287`).
- Table headers are `td` instead of `th` with scope:
  - Weekday headers are `<td>` (e.g., `src/ts/templates.ts:27`).
- No keyboard navigation:
  - DOM layer binds `click`/`touchstart` only (e.g., `src/ts/dom.ts:99`).
- No explicit state semantics:
  - Selected/today/adjacent/inactive are only CSS class tokens; not exposed as ARIA states (selection toggling around `src/ts/dom.ts:139`).
- No live announcement for month changes.

## Goals

- Make navigation controls keyboard and screen-reader friendly.
- Expose a semantically correct calendar grid that is navigable via keyboard.
- Convey state (today, selected, disabled, adjacent) via ARIA.
- Announce month changes to assistive tech.

## Minimal, Backward-Compatible Improvements (Quick Wins)

These changes improve a11y significantly without altering the core API or event wiring.

1. Use native buttons for controls

- Replace navigation/control elements with `<button type="button">`.
- Add accessible names: `aria-label="Previous month"`, `aria-label="Next month"`, etc.
- Group controls in a `role="toolbar"` and ensure visible focus styles.

2. Add a live/labelled heading for the current period

- Add a heading (e.g., `<h2 id="clndr-heading" aria-live="polite">November 2025</h2>`).
- Reference it from the calendar container via `aria-labelledby`.

3. Use table semantics for weekdays and include a caption

- Keep `<table>` and add `<caption class="sr-only">Month Year calendar</caption>`.
- Use `<th scope="col">` for weekday headers.

4. Render days as buttons inside cells

- Keep the existing day class on the clickable element for delegated events.
- Use `<button class="day" type="button">` inside the `<td>`.
- Add `data-date="YYYY-MM-DD"` and `aria-label="Wednesday, November 6, 2025"`.
- Reflect states as:
  - Today: `aria-current="date"`
  - Selected: `aria-pressed="true"` or `aria-selected="true"`
  - Inactive/Out-of-range: `aria-disabled="true"` (and disable click handler)

5. Keyboard basics without a grid refactor

- With days as `button`s, users can Tab through days and Enter/Space to select.
- Add key handlers to support arrow navigation (see “Keyboard Navigation” below) while preserving click behavior.

## Example: Accessible Default Template (table-based)

This drops into `template` usage or can guide a future default template update. It keeps selectors and classes so current delegated events continue working.

```html
<div class="clndr" aria-labelledby="clndr-heading">
  <div class="clndr-controls" role="toolbar">
    <button class="clndr-previous-year-button" type="button" aria-label="Previous year">«</button>
    <button class="clndr-previous-button" type="button" aria-label="Previous month">‹</button>
    <h2 id="clndr-heading" class="month" aria-live="polite"><%= month %> <%= year %></h2>
    <button class="clndr-next-button" type="button" aria-label="Next month">›</button>
    <button class="clndr-next-year-button" type="button" aria-label="Next year">»</button>
    <button class="clndr-today-button" type="button" aria-label="Go to today">Today</button>
  </div>

  <table class="clndr-table" border="0" cellspacing="0" cellpadding="0">
    <caption class="sr-only"><%= month %> <%= year %> calendar</caption>
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
              <button
                type="button"
                class="<%= day.classes %> day"
                data-date="<%= day.date ? day.date.toISO ? day.date.toISO() : day.date : '' %>"
                aria-label="<%= day.date && day.date.toFormat ? day.date.toFormat('cccc, LLLL d, yyyy') : day.day %>"
                <%= day.properties?.isInactive ? 'aria-disabled="true"' : '' %>
                <%= day.properties?.isToday ? 'aria-current="date"' : '' %>
                <%= (day.classes || '').indexOf('selected') >= 0 ? 'aria-pressed="true"' : 'aria-pressed="false"' %>
              >
                <span class="day-contents"><%= day.day %></span>
              </button>
            </td>
          <% } %>
        </tr>
      <% } %>
    </tbody>
  </table>
</div>
```

Support CSS for visually hidden text:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

## Keyboard Navigation

Add keyboard handling to the DOM layer to make arrow keys useful while staying compatible with existing click handlers.

Suggested delegated binding (insert near other event bindings):

```ts
// In dom.ts, during bindEvents()
this.element.on(
  'keydown.clndr',
  `.${targets.day}`,
  (event: JQuery.KeyDownEvent) => {
    const key = (event.key || '').toLowerCase()
    const target = event.currentTarget as HTMLElement
    const iso = target.getAttribute('data-date') || ''
    if (!iso) return

    // Prevent page scroll for handled keys
    const handledKeys = [
      'arrowleft',
      'arrowright',
      'arrowup',
      'arrowdown',
      'home',
      'end',
      'pageup',
      'pagedown'
    ]
    if (handledKeys.includes(key)) event.preventDefault()

    const cur = this.adapter.fromISO(iso)
    let next = cur
    switch (key) {
      case 'arrowleft':
        next = cur.minus({ days: 1 })
        break
      case 'arrowright':
        next = cur.plus({ days: 1 })
        break
      case 'arrowup':
        next = cur.minus({ days: 7 })
        break
      case 'arrowdown':
        next = cur.plus({ days: 7 })
        break
      case 'home':
        next = cur.startOf('week')
        break
      case 'end':
        next = cur.endOf('week')
        break
      case 'pageup':
        this.handleNavigation('back')
        return
      case 'pagedown':
        this.handleNavigation('forward')
        return
      default:
        return
    }

    // Move focus to the new day if present
    const sel = `.calendar-day-${next.format('YYYY-MM-DD')}`
    const el = this.container.find(sel).get(0) as HTMLElement | undefined
    if (el) el.focus()
  }
)
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
  - Proper table headers.
  - No `aria-*` attribute misuse.
- Include keyboard navigation tests (arrow keys, Home/End, PageUp/PageDown) for basic behavior.

## Longer-Term Enhancements

- Provide a first-class, accessible default template as an option (e.g., `template: DEFAULT_A11Y_TEMPLATE`).
- Consider a Grid pattern: `role="grid"`, `role="row"`, `role="gridcell"`, with roving tabindex and `aria-activedescendant`.
- Add options to customize labels (e.g., `labels.previousMonth`, `labels.nextMonth`, `labels.today`).
- Expose selected range semantics if range selection is added later (`aria-multiselectable`).

## Implementation Checklist

- Controls are `<button type="button">` with clear labels.
- Calendar container has a programmatic name (`aria-labelledby`) and month heading has `aria-live="polite"`.
- Weekday headers use `<th scope="col">`.
- Day cells contain focusable controls with `data-date` and ARIA states.
- Keyboard navigation added for arrows/home/end/page up/down.
- Focus is preserved or moved predictably after month changes.
- Visual focus indicator is visible for all interactive elements.

## Non-Goals (for this pass)

- Changing public API or event payloads.
- Rewriting to a full ARIA Grid with `aria-activedescendant` (good future candidate).

---

If you want, I can: (a) switch the built-in template to the accessible version, (b) add the keyboard handler scaffold in `src/ts/dom.ts`, and/or (c) add a minimal `jest-axe` suite to prevent future regressions.
