# Plan: Right-to-Left (RTL) Language Support

Goal: Provide first-class RTL layout support in CLNDR so calendars render correctly for RTL locales (e.g., Arabic, Hebrew, Persian), while keeping defaults backward compatible for LTR consumers.

## Scope

- Add RTL-aware layout (controls and grid) driven by a new option and/or locale detection.
- Improve first-day-of-week behavior for RTL locales, especially when using the Luxon adapter.
- Update demo and docs to showcase RTL usage.

Non-goals

- Reimplement full i18n; we continue to rely on Moment/Luxon for localized strings.
- Force any specific religious/cultural week-start; follow library locale data where possible.

## API Design

- Add `direction?: 'auto' | 'ltr' | 'rtl'` (default: `'auto'`).
  - `'auto'`: derive from locale if possible; otherwise fall back to `'ltr'`.
  - `'rtl'`: force RTL layout regardless of locale.
  - `'ltr'`: force LTR layout.
- Add `onDirectionChange?(): void` callback (optional) fired when direction changes due to locale updates or re-init.
- Keep existing `locale` option; direction is orthogonal but can be inferred from it in auto mode.

## Detection Logic

- Preferred: use `Intl.Locale` when available: `new Intl.Locale(locale).getTextInfo?.direction === 'rtl'` (or `textInfo.direction` in newer engines).
- Fallback: maintain a small allowlist for common RTL language tags: `['ar', 'he', 'fa', 'ur']` (match prefixes case-insensitively, e.g., `ar`, `ar-SA`).
- Expose a private helper `isRtlLocale(locale: string): boolean` used by both Moment and Luxon paths for consistency.

## Rendering & CSS

- DOM: apply a `dir` attribute or class on the calendar root when RTL is active.
  - Attribute: set `dir="rtl"` on the `.clndr` container.
  - Class fallback: also add `.rtl` for CSS selectors that prefer class-based overrides.
- CSS adjustments (added to demo CSS and documented for consumers):
  - Reverse floats in controls and grid:
    - Previous/next buttons swap sides; `.clndr-previous-button { float: right }`, `.clndr-next-button { float: left }` within `[dir='rtl']`.
    - Day cells and weekday headers float right to reverse visual order.
  - Keep semantic order of DOM nodes the same (Sun..Sat or locale-first), but rely on CSS to reverse the visual flow for RTL. This avoids logic duplication.
  - Optionally switch controls to flexbox for simpler direction handling (`flex-direction: row-reverse` under RTL).
- Icons: left/right chevrons remain the same characters; visual placement swap handles meaning (consider replacing with `rotate(180deg)` CSS if needed).

## Date Adapters

- Moment adapter: already respects `localeData().firstDayOfWeek()`; no change required for week-start.
- Luxon adapter: improve `firstDayOfWeek()` logic:
  - Try `Intl.Locale(locale).weekInfo?.firstDay` (Mon=1..Sun=7) where supported; map to 0..6.
  - Fallback mapping expanded: `fr`, `de`, `en-GB` => Monday; `ar`, `he`, `fa`, `ur` => Saturday or Sunday based on `weekInfo`/regional defaults (prefer `weekInfo` where present; otherwise default to Saturday for `ar-SA`, Sunday for `ar-EG`, with a simple regional table and safe default of Sunday if unknown).
  - Keep behavior deterministic and documented.

## Templates

- Ensure the default template remains direction-agnostic:
  - Avoid hardcoded left/right assumptions in markup; prefer utility classes that flip under RTL.
  - No data reordering for RTL—only visual flow changes.

## Demo Updates

- Add locales to the dropdown: `ar`, `he`, `fa`.
- Add a direction toggle: `Auto/LTR/RTL` to demonstrate forcing mode regardless of locale.
- Set `dir` attribute on the `.clndr` container according to the chosen mode.
- Load `moment-with-locales` (already done) to ensure strings localize.

## Tests

- Unit tests (Jest + jsdom):
  - Verify `direction: 'rtl'` sets `dir="rtl"` on calendar root and does not throw.
  - Verify weekday labels still match locale strings irrespective of direction setting.
  - Luxon adapter: add tests for `firstDayOfWeek()` for `ar`, `he` when `Intl.Locale.weekInfo` exists (feature-detected), with fallbacks guarded.
- Visual/manual (demo):
  - Confirm button placement and day grid flow look correct in RTL.

## Migration & Backward Compatibility

- Default remains `'auto'` with LTR fallback—no breaking change for existing consumers.
- CSS: ship minimal RTL overrides in demo styles only; provide a snippet in README for app integration.
- Do not change DOM structure or class names.

## Rollout Plan

1. Core option + detection helper + apply `dir`/`.rtl` on root.
2. CSS overrides in demo (and README snippet) to flip layout.
3. Luxon: enhance `firstDayOfWeek()` using `Intl.Locale.weekInfo` with fallback mapping.
4. Demo UX: add locales (ar/he/fa) and direction toggle.
5. Tests: adapter week-start and DOM direction attribute.
6. Docs: README section "Right-to-Left (RTL) Support" with usage examples.

## Risks & Mitigations

- Mixed-direction content (e.g., English event titles in Arabic UI) may need additional CSS (e.g., `unicode-bidi`); document best practices.
- Environment differences for `Intl.Locale.weekInfo`: feature-detect and fallback gracefully.
- Some locales differ on week start across regions; call out variance in docs and recommend overriding `weekOffset` if needed.

## Success Criteria

- Visual layout mirrors correctly in RTL (controls and grid) without DOM reordering.
- Weekday labels and month names continue to localize as today.
- Luxon week-start aligns with system data where `Intl` provides it; otherwise reasonable defaults.
- Demo clearly shows RTL working across adapters and locales.
