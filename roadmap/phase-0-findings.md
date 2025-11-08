# Phase 0 – Discovery & Baseline (Findings)

This document captures the audit of the current CLNDR codebase, the Moment.js usage map, the date format inventory, and links to DOM snapshots captured from the demo and tests. It serves as the baseline for the TypeScript + Luxon migration.

## Responsibilities in `src/clndr.js`
- Initialization: constructor merges options, validates, normalizes time window (month/days), applies constraints, and seeds state (`month`, `intervalStart`, `intervalEnd`).
- Configuration parsing: default options, multi‑day event shape, optional injected `moment` instance, `weekOffset`, `constraints`, `forceSixRows`, `selectedDate`, custom templates.
- Templating: underscore template compilation when `render` is not provided; default `clndrTemplate` string; exposes templating context (`days`, `months`, `daysOfTheWeek`, `month`, `year`, `numberOfRows`, `intervalStart`, `intervalEnd`).
- Date math: interval navigation (days/months/weeks), boundary calculations, diff/clone/add/subtract/startOf/endOf/weekday/day.
- Event parsing: converts events into `_clndrStartDateObject` and `_clndrEndDateObject` Moment instances; supports single and multi‑day events and performance optimized filtering per interval/month.
- Rendering: builds `days` array (and `months` for multi‑month views), applies classes (today/past/event/inactive/adjacent/selected), and returns HTML to target element.
- DOM events: binds next/prev/today/year navigation; exposes callbacks (`click`, `today`, `nextMonth`, `previousMonth`, `onMonthChange`, `nextYear`, `previousYear`, `onYearChange`, `nextInterval`, `previousInterval`, `onIntervalChange`).
- Public API: `back`, `previous`, `forward`, `next`, `previousYear`, `nextYear`, `today`, `setMonth`, `setYear`, `setIntervalStart`, `setEvents`, `addEvents`, `removeEvents`, `setExtras`, `destroy`.

## Public API surface (by method)
`init`, `validateOptions`, `shiftWeekdayLabels`, `createDaysObject`, `createDayObject`, `render`, `bindEvents`, `buildTargetObject`, `getTargetDateString`, `triggerEvents`, navigation (`back`, `previous`, `forward`, `next`, `previousYear`, `nextYear`, `today`), setters (`setMonth`, `setYear`, `setIntervalStart`, `setExtras`, `setEvents`, `addEvents`, `removeEvents`), event helpers (`addMomentObjectToEvents`, `addMultiDayMomentObjectsToEvents`), `calendarDay`, `destroy`.

## Moment.js usage matrix (in core)
- Construction/parsing: `moment()`, `moment(string)`, `moment(array)`, injected `options.moment` supported.
- Formatting: `format('dd')`, `format('YYYY-MM-DD')`, `format('MMMM')`.
- Cloning: `clone()`.
- Math: `add(n, 'days'|'months'|'years')`, `subtract(n, 'days'|'months'|'years')`, `diff(a, 'days')`.
- Boundaries: `startOf('day'|'week'|'month')`, `endOf('day'|'week'|'month')`.
- Calendar fields: `weekday(n)`, `day()` (in tests), `date()`, `month()`, `year()`, `daysInMonth()` (tests), `set('month'|'year')`.
- Comparison/validity: `isBefore()`, `isAfter()`, `isSame()`, `isValid()`.
- Misc: `duration(moment().diff(start)).asSeconds()` (tests).

Note: The code relies on Moment’s weekday behavior and month/year set/compare semantics to preserve the visible grid when constraints apply.

## Date formats inventory (templates + tests)
- Core/template: `dd`, `YYYY-MM-DD`, `MMMM`.
- Demo: `M/DD`, `MMMM`.
- Tests/templates: `MMMM YYYY`, `MM/DD`, `YYYY-MM`, `YYYY-MM-` (concatenated day), `YYYY-MM-DD`.
- Tests (fixed day in format string): `YYYY-MM-02`, `YYYY-MM-04`, `YYYY-MM-05`, `YYYY-MM-12`, `YYYY-MM-22`, `YYYY-MM-25`.
- Tests (weekday name): `dddd`.

These will be normalized/mapped inside the DateAdapter when Luxon is introduced to preserve template behavior.

## Architecture (current)

```mermaid
flowchart LR
  A[jQuery container elements] --> B[CLNDR Core (clndr.js)]
  subgraph B
    B1[Init + Options]
    B2[Event Parsing]
    B3[Date Math]
    B4[Render]
    B5[Bind DOM Events]
  end
  B4 --> C[Underscore Template]
  C --> D[DOM Output]
  E[User Interactions] --> B5
  F[Moment.js] --- B3
```

## Baseline DOM snapshots
Snapshots captured via Puppeteer of the current demo and tests environments:
- HTML: `roadmap/baseline/demo-index.container.html`
- PNG:  `roadmap/baseline/demo-index.png`
- HTML: `roadmap/baseline/tests-test.container.html`
- PNG:  `roadmap/baseline/tests-test.png`
- Manifest: `roadmap/baseline/manifest.json`

Regenerate with (Bun preferred):

```
bun run baseline:snapshots
```

## Notes & edge cases
- Week offset handling: weekdays shifted by `weekOffset`, affects header labels and leading/trailing days.
- Constraints: both weekly and monthly mode have custom constraint logic; adapter must preserve inclusive end semantics.
- Multi‑month and forced six rows: logic pads days to full weeks and optionally to 6 rows (42 cells).
- Selected and inactive day classing depends on date math and constraint checks.

## Ready for Phase 1
- TS/ESM tooling can be added without behavioral change. Initial façade can delegate to current JS while types are authored.
