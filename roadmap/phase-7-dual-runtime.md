# Phase 7 – Dual Runtime & Validation

This release introduces a Luxon-backed DateAdapter and the ability to run CLNDR with either Moment (default) or Luxon.

## How to Select the Date Library

- Option on init: pass `dateLibrary: 'moment' | 'luxon'` and optional `locale` / `zone`.
- Test/CI override: set env var `DATE_LIB=moment|luxon` to choose the adapter when not provided explicitly in options.

Example:

```js
$('.el').clndr({ dateLibrary: 'luxon', locale: 'fr' })
```

## Notes and Differences

- Tokens: CLNDR templates and options continue to use Moment tokens. The Luxon adapter maps common tokens (e.g., `YYYY`, `MMMM`, `M/DD`, `dddd`, `dd`) to Intl/ICU under the hood for parity.
- Week start: Luxon does not expose first day-of-week via Intl; the adapter approximates using a small mapping aligned with Moment defaults (`en` Sunday; `fr`, `de`, `en-GB` Monday). Set `weekOffset` to force alignment regardless of locale.
- Invalid dates: Luxon keeps an invalid DateTime state; CLNDR avoids relying on invalid sentinels and uses ISO parsing + sane defaults. Keep template format tokens simple.
- DST boundaries: For calendar math CLNDR uses date-only boundaries and endOf('day') where appropriate. For time zone-sensitive scenarios, pass a `zone` to the adapter (`dateLibrary: 'luxon', zone: 'Europe/Paris'`).
- Locales: Luxon requires full ICU data to render localized names in Node. CI sets `NODE_ICU_DATA=node_modules/full-icu`. Browsers rely on the host’s Intl data.

## Demo

The demo page now includes a library and locale toggle to compare Moment vs Luxon behavior side-by-side. See `demo/index.html`.

## CI

GitHub Actions matrix runs the full Jest suite with `DATE_LIB=moment` and `DATE_LIB=luxon` across Node 18 and 20. Snapshots must match.
