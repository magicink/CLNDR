# CLNDR Master Upgrade Plan (TypeScript + Luxon)

## Goals

- Migrate CLNDR source to TypeScript with modular architecture and strong typing.
- Replace Moment.js with Luxon using a unified DateAdapter interface.
- Maintain public API compatibility and existing demo behavior throughout.
- Produce modern ESM and UMD bundles with minimal build friction.

## Scope

- TypeScript tooling, typings, and module extraction from `src/clndr.js`.
- Date adapter abstraction with Moment and Luxon implementations.
- Dual-runtime validation, CI matrix, and eventual removal of Moment.
- Documentation, demos, and configuration updates.

## Guiding Principles

1. Backwards-compatible releases during migration; major changes only after parity proven.
2. Incremental conversions with tests that prove legacy parity before rewriting behavior.
3. Prefer small, pure modules with clear ownership and no hidden global state.
4. All date logic flows through `DateAdapter`; no direct Moment/Luxon calls in core modules.
5. CI enforces adapter usage and runs both runtimes until Moment is removed.
6. Tooling preference: use Bun where possible (e.g., `bun install`, `bun run`); fall back to npm/yarn when Bun is unavailable in the environment.

## Prerequisites

- Baseline tests and demo snapshots captured.
- Agreement on `DateAdapter` interface surface and configuration.

## Phase 0 – Discovery & Baseline (0.5–1 week) ✅

- Deliverable: Architecture diagram + usage matrix for date ops. See `roadmap/phase-0-findings.md` and `roadmap/baseline/*`.

## Phase 1 – Tooling Bootstrap (1 week) ✅

- Deliverable: Passing CI with compiling TS scaffold; Husky + lint-staged active and commit messages validated against Conventional Commits.

## Phase 2 – Type Definitions & Facade (1–2 weeks) ✅

- Deliverable: Minor release with official type definitions.

## Phase 3 – Test Harness (Jest) (0.5–1 week) ✅

Establish a modern unit test stack and DOM snapshot testing.

- Deliverable: Green Jest runs with baseline snapshots and coverage reporting.

## Phase 4 – Build Pipeline (Rollup) (0.5–1 week) ✅

- Deliverable: Reproducible ESM/UMD builds via Rollup with types and sourcemaps.

## Phase 5 – Module Extraction + Adapter Intro (2–3 weeks)

Extract focused TS modules and introduce the `DateAdapter` boundary.

- [x] `config.ts`: normalize, default, and validate options.
- [x] `state.ts`: current month, events, selection; pure update helpers.
- [x] `templates.ts`: template compilation utilities.
- [x] `render.ts`: DOM rendering and minimal mutation instructions.
- [x] `events.ts`: DOM event binding/unbinding; typed callbacks.
- [x] `date-adapter/adapter.ts`: interface with required methods:
  - `now()`, `fromISO()`, `fromFormat(fmt)`, `toISO()`, `format(fmt)`
  - `startOf(unit)`, `endOf(unit)`, `plus(delta)`, `minus(delta)`
  - `weekday()` (1–7), `day()` (1–31), `daysInMonth()`
  - comparisons: `isBefore()`, `isAfter()`, `hasSame(unit)`
- [x] Adapter locale surface (i18n):
  - `withLocale(locale)`, `getLocale()`
  - `firstDayOfWeek()` (locale-based) and `setWeekday(date, index)`
  - `weekdayLabels(style: 'narrow' | 'short' | 'long')` for header generation
  - Centralize token mapping used by CLNDR: `YYYY-MM-DD` → `yyyy-LL-dd`, `dd` (weekday short), `MMMM`, `M/DD` → `L/dd`
- [x] `moment-adapter.ts`: adapter implemented against current behavior.
- [x] Refactor core to consume adapter for init; remove direct Moment calls from core modules.
  - Deliverable: `src/clndr.js` delegates to TS modules when available (UMD global `clndr`), using adapter-backed weekday labels and initial state. Falls back to legacy path when adapter bundle isn’t present.

Status: TS modules and Moment adapter are implemented under `src/ts`. Legacy `src/clndr.js` now consults the adapter (when the UMD bundle is present) for initial state and weekday labels, preserving legacy behavior and enabling progressive adoption.

## Phase 6 – Luxon Adapter (1 week)

- [x] Implement `luxon-adapter.ts` using Luxon `DateTime`.
- [x] Add config: `dateLibrary: 'moment' | 'luxon'` (default `'moment'`) and advanced `dateAdapter` injection.
- [x] Ensure locale/zone: integrate Luxon locale/zone via adapter factory and plugin hand-off.
- [x] Map/normalize formatting tokens inside adapter to preserve existing templates.
- [x] Parity tests for `YYYY-MM-DD`, day labels, month boundaries, and calendar grid.
- [x] Weekday labels via `Info.weekdays('short'|'narrow', { locale })`; month names via `toFormat('MMMM')`.
- [x] Week start parity: `startOf('week')` honors locale using `firstDayOfWeek()` and `weekOffset` rotation in config.
- [x] Expose `locale` opt-in on CLNDR options that pipes into adapter.
- Deliverable: Opt-in Luxon support with green tests.

## Phase 7 – Dual Runtime & Validation (1–2 weeks)

- [x] CI matrix runs full suite with both adapters; snapshots must match.
- [x] Demo toggle to switch libraries at runtime for manual testing.
- [x] Document migration notes and subtle differences (invalid dates, DST boundaries).
- [ ] Publish minor release with Luxon opt-in and solicit feedback. (pending)
- [x] Ensure ICU data for Luxon locales on CI (set `NODE_ICU_DATA` to full-icu or use Node image with full-icu).
- [x] Add i18n tests across locales (e.g., `en`, `fr`, `de`): weekday labels, month names, week start alignment, and `weekOffset` overlay.
- Deliverable: Stable opt-in Luxon release.

## Phase 8 – Full TypeScript Source of Record (2 weeks)

- [ ] Implement façade entirely in TS; compile to UMD/ESM.
- [ ] Delete legacy JS source after parity passes; keep compatibility build artifacts.
- [ ] Update docs/demos/builds to reference TS entry.
- Deliverable: Major-version RC built from TypeScript.

## Phase 9 – Default Switch to Luxon (1 week)

- [ ] Change default `dateLibrary` to `'luxon'`; keep Moment path temporarily.
- [ ] Deprecate passing a Moment instance; prefer adapter or `dateLibrary`.
- [ ] Add deprecation warnings and docs.
- Deliverable: Minor release with Luxon default and clear deprecation messaging.

## Phase 10 – Remove Moment (major) (0.5 week)

- [ ] Remove Moment adapter and dependency.
- [ ] Keep `DateAdapter` interface stable for future libraries.
- [ ] Update README/demos to reference Luxon only.
- Deliverable: Moment-free major release.

## Phase 11 – Distribution (GitHub Actions) (0.5–1 week)

Automate build, test, and release workflows (final phase).

- [ ] Add .github/workflows/ci.yml to run on PRs and pushes:
  - Jobs: lint, build (Rollup), test (Jest) with matrix on Node LTS and DATE_LIB=moment|luxon.
  - Cache dependencies and Jest cache; upload coverage; store build artifacts.
- [ ] Add release automation via Release Please:
  - Add
    elease-please-config.json and .release-please-manifest.json to configure package, changelog sections, and release type.
  - Add .github/workflows/release-please.yml using google-github-actions/release-please-action to open release PRs and create GitHub Releases on merge.
- [ ] Add publish workflow on
      elease: published (e.g., .github/workflows/publish.yml):
  - Build with Rollup; publish to npm with provenance (
    pm publish --provenance) using NPM_TOKEN.
  - Upload dist/\*, source maps, and dist/clndr.d.ts as release assets if desired.
- [ ] Versioning + changelog: use Release Please for managed version bumps and CHANGELOG generation.
- [ ] Security: use organization secrets for NPM_TOKEN; enable branch protection and required checks.

## Configuration

- `dateLibrary`: `'moment' | 'luxon'` (default `'moment'` until Phase 9).
- `dateAdapter`: custom adapter injection for power users/testing.
- `locale`: optional locale string, applied via adapter; defaults to environment.
- `zone`: optional IANA timezone identifier, forwarded to adapter.
- Respect `locale`, `weekOffset`, and timezone settings via adapter hooks.

## Acceptance Checklist

- [ ] Rollup builds produce UMD/ESM artifacts used by demos/tests.
- [ ] Public API is typed and matches current README/tests.
- [ ] Core uses `DateAdapter` only (no direct Moment/Luxon in modules).
- [ ] Tests pass under both adapters with matching DOM snapshots.
- [ ] Jest coverage thresholds met; smoke and snapshot tests stable.
- [ ] Demo parity verified across locales and week offsets.
- [ ] i18n parity: weekday headers reflect locale; month names localized; week start parity + `weekOffset` overlay validated in `en`/`fr`/`de`.
- [ ] Adapter token mapping validated (`YYYY-MM-DD`, `MMMM`, `dd`, `M/DD` → Luxon equivalents) with no visible regressions.
- [ ] CI configured with full ICU so Luxon locales render correctly.
- [ ] README updated with migration notes and examples.
- [ ] `package.json`: add `luxon`; remove `moment` at Phase 10.

## Risks & Mitigations

- Formatting differences: Centralize formats in adapter; add tests for all template tokens.
- Week start behavior: Use CLNDR `weekOffset`; do not rely on library defaults.
- Locale availability: Document `Intl` locale data requirements and polyfills.
- DST/zone math: Prefer date-only comparisons for calendar logic; add boundary tests.
- Build complexity: Integrate TS compile into existing Grunt tasks incrementally.
- API drift: Lock with façade-level tests and snapshots.

## Tracking & Ownership

- Create GitHub issues per phase/milestone; assign module leads.
- CI matrix for both adapters until Moment removal.
- Weekly migration sync until Phase 8 completes.
