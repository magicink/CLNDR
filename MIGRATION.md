# CLNDR Migration Guide

This guide helps migrate from legacy CLNDR v1.x (e.g., 1.5.1) to the modern TypeScript-backed build in this repository.

## Overview of Changes

- Core rewritten in TypeScript with adapter-based date handling (Moment or Luxon)
- ESM and UMD builds: `dist/clndr.esm.js` and `dist/clndr.umd.js` (minified in production builds)
- Optional template rendering via Underscore/Lodash `_.template()`; minimal internal renderer as fallback
- jQuery plugin API remains for backward compatibility

## Breaking/Behavioral Changes

- Default date library remains `moment` for now, but will switch to `luxon` in Phase 9
  - Deprecation warning is logged when no `dateLibrary` is specified
  - Action: Specify `dateLibrary: 'moment'` or `'luxon'` explicitly
- Templates
  - If Underscore/Lodash is present, CLNDR compiles templates with `_.template`
  - Otherwise, a minimal internal renderer supports only `<%= ... %>` (no loops/conditionals)
  - Action: include Underscore or provide your own `render(data)` function
- Multi-day events mapping is explicit via `multiDayEvents` option
- Export surface is modernized; ESM consumers can import helpers directly

## How to Migrate

1. Include the new bundle(s)
   - Browser (UMD): `dist/clndr.umd.js` or `clndr.min.js`
   - Browser (UMD): `dist/clndr.umd.js`

2. Choose Date Library
   - Moment (legacy parity): `$('.el').clndr({ dateLibrary: 'moment' })`
   - Luxon (modern): `$('.el').clndr({ dateLibrary: 'luxon' })`
   - Advanced: Provide a custom `dateAdapter`

3. Templates
   - Keep using your existing Underscore templates; ensure Underscore is loaded
   - Or pass a `render(data)` function that returns HTML

4. Multi-day Events
   - Configure mapping explicitly:
     ```js
     multiDayEvents: { startDate: 'startDate', endDate: 'endDate', singleDay: 'date' }
     ```

5. Selection and Constraints
   - Options are compatible; new options include `trackSelectedDate`, `ignoreInactiveDaysInSelection`

## jQuery Plugin vs. Programmatic API

- jQuery plugin remains: `$('.cal').clndr(opts)`
- Programmatic factory also available for ESM/UMD: `clndr(selectorOrElement, opts)`

## Packaging and Types

- ESM: `dist/clndr.esm.js` (module)
- UMD: `dist/clndr.umd.js` (global `clndr`)
- UMD: `dist/clndr.umd.js` (global `clndr`, minified in production builds)
  - Future enhancement: expand `dist/clndr.d.ts` to export the adapter/core surfaces directly

## Deprecations and Phase 9 Default Switch

- The default `dateLibrary` will change to `'luxon'` in Phase 9
  - You will see a console warning if you rely on the default
  - Set `dateLibrary` explicitly to silence the warning

## Troubleshooting

- Template code appears on the page
  - Ensure Underscore is loaded or provide a `render()` function
- Events not spanning days correctly
  - Check `multiDayEvents` mapping
- Locale/Week start differences
  - Set `locale` and/or `zone` (Luxon), or ensure Moment locale is set
