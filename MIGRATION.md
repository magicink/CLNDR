# CLNDR Migration Guide

This guide helps migrate from legacy CLNDR v1.x (e.g., 1.5.1) to the modern TypeScript-backed build in this repository.

## Overview of Changes

- Core rewritten in TypeScript with adapter-based date handling (Luxon via DateAdapter)
- ESM and UMD builds: `dist/clndr.esm.js` and `dist/clndr.umd.js` (minified in production builds)
- Optional template rendering via Lodash (preferred) or Underscore `_.template()`; minimal internal renderer as fallback
- jQuery plugin API remains for backward compatibility

## Breaking/Behavioral Changes

- Default date library is now `luxon` (Phase 9)
  - Action: Use Luxon (default)
  - When no `locale` is provided, CLNDR uses the adapter/default environment locale
- Deprecation: Passing Moment instances directly in options (e.g., `startWithMonth`, `selectedDate`, event dates)
  - Continue to work temporarily, but a console warning is logged
  - Action: Provide ISO strings (recommended), native `Date`, or set `dateAdapter`
- Templates
  - If Lodash/Underscore is present, CLNDR compiles templates with `_.template` (Lodash preferred)
  - Otherwise, a minimal internal renderer supports only `<%= ... %>` (no loops/conditionals)
  - Action: include Lodash (recommended for ESM: `lodash-es`) or provide your own `render(data)` function
- Multi-day events mapping is explicit via `multiDayEvents` option
- Export surface is modernized; ESM consumers can import helpers directly

## How to Migrate

1. Include the new bundle(s)
   - Browser (UMD): `dist/clndr.umd.js`

2. Date Adapter (optional)
   - Provide a custom `dateAdapter` if needed; otherwise the default Luxon adapter is used

3. Templates
   - Keep using your existing Lodash/Underscore templates; ensure Lodash is loaded
   - Or pass a `render(data)` function that returns HTML

4. Wrapper-free styling (opt-in)
   - New (optional) options:
     - `applyThemeClasses: true` — adds container classes like `clndr--mode-table` and `clndr--theme-default`
     - `theme?: 'default' | 'grid' | 'months'` — override default theme for the current mode
   - While CSS is being refactored, CLNDR also adds a legacy wrapper class (`cal1|cal2|cal3`) automatically when `applyThemeClasses` is true. This keeps existing styles working without manual wrappers. Wrapper usage will be deprecated once the stylesheet targets the new classes.

5. Multi-day Events
   - Configure mapping explicitly:
     ```js
     multiDayEvents: { startDate: 'startDate', endDate: 'endDate', singleDay: 'date' }
     ```

6. Selection and Constraints
   - Options are compatible; new options include `trackSelectedDate`, `ignoreInactiveDaysInSelection`

## jQuery Plugin vs. Programmatic API

- jQuery plugin remains: `$('.cal').clndr(opts)`
- Programmatic factory also available for ESM/UMD: `clndr(selectorOrElement, opts)`

## Packaging and Types

- ESM: `dist/clndr.esm.js` (module)
- UMD: `dist/clndr.umd.js` (global `clndr`)
  - Future enhancement: expand `dist/clndr.d.ts` to export the adapter/core surfaces directly

## Troubleshooting

- Template code appears on the page
  - Ensure Lodash is loaded or provide a `render()` function
- Styles not applying without `cal1/cal2/cal3`
  - Pass `applyThemeClasses: true` so CLNDR adds container theme/mode classes (and a temporary legacy wrapper class) for styling without manual wrappers.
- Events not spanning days correctly
  - Check `multiDayEvents` mapping
- Locale/Week start differences
  - Set `locale` and/or `zone` (Luxon)

## Legacy CSS Removal and Mapping

The modern stylesheet (`dist/clndr.css`) uses Grid/Flex and CSS variables. Legacy float/table rules and wrapper classes are not shipped. Migrate away from legacy wrappers/selectors to the modern classes:

- `.cal1` (basic month, table layout) → Use `applyThemeClasses: true` and modern defaults (`.clndr--mode-table` + `.clndr--theme-modern`), or provide your own CSS targeting `.clndr`/`.clndr-grid`.
- `.cal2` (float-based grid) → Use `applyThemeClasses: true` with Grid mode (`lengthOfTime.days`) and `.clndr--theme-modern`.
- `.cal3` (float-based multi-month) → Use Months mode (`lengthOfTime.months`) with `.clndr--theme-modern`.
- `.clndr-table` / `.header-days` / float rules / `.clearfix` → Not present in modern CSS. Replace with the modern Grid/Flex classes under `.clndr--theme-modern`.

Notes

- The modern stylesheet uses CSS variables (`--clndr-*`) for theming and Grid/Flex for layout. Prefer logical properties where needed.
