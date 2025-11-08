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

## Phase 0 – Discovery & Baseline (0.5–1 week)

- [x] ~~Audit `src/clndr.js` responsibilities (init, config parsing, templating, date math, events, public API).~~
- [x] ~~Inventory Moment usage: parsing, formatting, add/subtract, start/endOf, weekday/day, diff, daysInMonth.~~
- [x] ~~List all date formats used in templates and tests.~~
- [x] ~~Capture DOM snapshots from demos/tests to use as parity baselines.~~
- Deliverable: Architecture diagram + usage matrix for date ops. See `roadmap/phase-0-findings.md` and `roadmap/baseline/*`.

## Phase 1 – Tooling Bootstrap (1 week)

- [x] ~~Add TypeScript, ESLint + Prettier, and `tsconfig.json` (ES2018 target, incremental).~~
- [x] ~~Set up Husky git hooks and lint-staged:~~
  - `pre-commit`: run `lint-staged` to apply Prettier and ESLint on staged files.
  - `commit-msg`: run Conventional Commits lint (`@commitlint/config-conventional`).
- [x] ~~Introduce `src/ts/` and wire build: `tsc` → `dist/` alongside existing Grunt tasks.~~
- [x] ~~Add minimal smoke tests and CI wiring; full Jest harness in Phase 3.~~
- Deliverable: Passing CI with compiling TS scaffold; Husky + lint-staged active and commit messages validated against Conventional Commits.

## Phase 2 – Type Definitions & Facade (1–2 weeks)

- [x] ~~Author `.d.ts` for public CLNDR API based on README and tests.~~
- [x] ~~Add `src/ts/facade.ts` exporting the same factory/API, delegating to legacy JS initially.~~
- [x] ~~Publish types so consumers benefit immediately without behavior changes.~~
- Deliverable: Minor release with official type definitions.

## Phase 3 – Test Harness (Jest) (0.5–1 week)

Establish a modern unit test stack and DOM snapshot testing.

- [x] ~~Add Jest with TypeScript support (`jest`, `ts-jest`, `@types/jest`).~~
- [x] ~~Configure `jest.config` with `jsdom` environment and coverage thresholds.~~
- [x] ~~Create test utilities for DOM rendering and snapshot helpers.~~
- [x] ~~Add scripts: `test`, `test:watch`, `test:cov` and integrate in CI.~~
- [x] ~~Parameterize adapter under test via env (e.g., `DATE_LIB=moment|luxon`); default to Moment for now.~~
- [x] ~~Seed unit tests for facade and render snapshots.~~
- Deliverable: Green Jest runs with baseline snapshots and coverage reporting.

## Phase 4 – Build Pipeline (Rollup) (0.5–1 week)

Adopt Rollup for consistent ESM/UMD outputs and type bundles.

    - [x] ~~Add `rollup.config.mjs` producing `dist/clndr.esm.js`, `dist/clndr.umd.js`, and sourcemaps.~~
    - [x] ~~Use plugins: `@rollup/plugin-node-resolve`, `@rollup/plugin-commonjs`, `@rollup/plugin-typescript` (or `rollup-plugin-typescript2`), optional `rollup-plugin-terser`.~~
    - [x] ~~Mark externals: `jquery`, `moment`, `luxon`; verify peerDependency treatment.~~
    - [x] ~~Generate `.d.ts` bundle (via Rollup `dts` or `tsc` emit) and verify type resolution.~~
    - [x] ~~Add `build`, `build:prod`, and size-check script; integrate into CI.~~
    - [x] ~~Keep Grunt tasks during transition; switch demos/docs to Rollup outputs when stable.~~
    - [x] ~~Remove LESS: replace `demo/css/clndr.less` with committed CSS (or small PostCSS pipeline); drop `less`/`grunt-contrib-less` and update demos.~~
    - [x] ~~Remove Grunt: migrate uglify/watch to Rollup + Terser; delete `Gruntfile.js` and related devDependencies.~~

- Deliverable: Reproducible ESM/UMD builds via Rollup with types and sourcemaps.

## Phase 5 – Distribution (GitHub Actions) (0.5–1 week)

Automate build, test, and release workflows.

Note: This phase is deferred and will be executed as the final phase of the project (after Phase 11). See "Phase 12 — Distribution (GitHub Actions)" at the end.

- [ ] Add `.github/workflows/ci.yml` to run on PRs and pushes:
  - Jobs: lint, build (Rollup), test (Jest) with matrix on Node LTS and `DATE_LIB=moment|luxon`.
  - Cache dependencies and Jest cache; upload coverage; store build artifacts.
- [ ] Add release automation via Release Please:
  - Add `release-please-config.json` and `.release-please-manifest.json` to configure package, changelog sections, and release type.
  - Add `.github/workflows/release-please.yml` using `google-github-actions/release-please-action` to open release PRs and create GitHub Releases on merge.
- [ ] Add publish workflow on `release: published` (e.g., `.github/workflows/publish.yml`):
  - Build with Rollup; publish to npm with provenance (`npm publish --provenance`) using `NPM_TOKEN`.
  - Upload `dist/*`, source maps, and `dist/clndr.d.ts` as release assets if desired.
- [ ] Versioning + changelog: use Release Please for managed version bumps and CHANGELOG generation.
- [ ] Security: use organization secrets for `NPM_TOKEN`; enable branch protection and required checks.
- Deliverable: Automated distribution pipeline producing versioned releases from tags.

## Phase 6 – Module Extraction + Adapter Intro (2–3 weeks)

Extract focused TS modules and introduce the `DateAdapter` boundary.

- [ ] `config.ts`: normalize, default, and validate options.
- [ ] `state.ts`: current month, events, selection; pure update helpers.
- [ ] `templates.ts`: template compilation utilities.
- [ ] `render.ts`: DOM rendering and minimal mutation instructions.
- [ ] `events.ts`: DOM event binding/unbinding; typed callbacks.
- [ ] `date-adapter/adapter.ts`: interface with required methods:
  - `now()`, `fromISO()`, `fromFormat(fmt)`, `toISO()`, `format(fmt)`
  - `startOf(unit)`, `endOf(unit)`, `plus(delta)`, `minus(delta)`
  - `weekday()` (1–7), `day()` (1–31), `daysInMonth()`
  - comparisons: `isBefore()`, `isAfter()`, `hasSame(unit)`
- [ ] Adapter locale surface (i18n):
  - `withLocale(locale)`, `getLocale()`
  - `firstDayOfWeek()` (locale-based) and `setWeekday(date, index)`
  - `weekdayLabels(style: 'narrow' | 'short' | 'long')` for header generation
  - Centralize token mapping used by CLNDR: `YYYY-MM-DD` → `yyyy-LL-dd`, `dd` (weekday short), `MMMM`, `M/DD` → `L/dd`
- [ ] `moment-adapter.ts`: adapter implemented against current behavior.
- [ ] Refactor core to consume only the adapter; remove direct Moment calls from core modules.
- Deliverable: `src/clndr.js` delegates to TS modules; Moment works via adapter.

## Phase 7 – Luxon Adapter (1 week)

- [ ] Implement `luxon-adapter.ts` using Luxon `DateTime`.
- [ ] Add config: `dateLibrary: 'moment' | 'luxon'` (default `'moment'`) and advanced `dateAdapter` injection.
- [ ] Ensure locale/zone: integrate Luxon `Settings.defaultLocale`/`defaultZone` with user config.
- [ ] Map/normalize formatting tokens inside adapter to preserve existing templates.
- [ ] Parity tests for `YYYY-MM-DD`, day labels, month boundaries, and calendar grid.
- [ ] Weekday labels via `Info.weekdays('short'|'narrow', { locale })`; month names via `toFormat('MMMM')`.
- [ ] Week start parity: compute headers using `firstDayOfWeek()` + `weekOffset` rotation to mirror Moment semantics.
- [ ] Expose `locale` opt-in on CLNDR options that pipes into adapter; re-render on change.
- Deliverable: Opt-in Luxon support with green tests.

## Phase 8 – Dual Runtime & Validation (1–2 weeks)

- [ ] CI matrix runs full suite with both adapters; snapshots must match.
- [ ] Demo toggle to switch libraries at runtime for manual testing.
- [ ] Document migration notes and subtle differences (invalid dates, DST boundaries).
- [ ] Publish minor release with Luxon opt-in and solicit feedback.
- [ ] Ensure ICU data for Luxon locales on CI (set `NODE_ICU_DATA` to full-icu or use Node image with full-icu).
- [ ] Add i18n tests across locales (e.g., `en`, `fr`, `de`): weekday labels, month names, week start alignment, and `weekOffset` overlay.
- Deliverable: Stable opt-in Luxon release.

## Phase 9 – Full TypeScript Source of Record (2 weeks)

- [ ] Implement façade entirely in TS; compile to UMD/ESM.
- [ ] Delete legacy JS source after parity passes; keep compatibility build artifacts.
- [ ] Update docs/demos/builds to reference TS entry.
- Deliverable: Major-version RC built from TypeScript.

## Phase 10 – Default Switch to Luxon (1 week)

- [ ] Change default `dateLibrary` to `'luxon'`; keep Moment path temporarily.
- [ ] Deprecate passing a Moment instance; prefer adapter or `dateLibrary`.
- [ ] Add deprecation warnings and docs.
- Deliverable: Minor release with Luxon default and clear deprecation messaging.

## Phase 11 – Remove Moment (major) (0.5 week)

- [ ] Remove Moment adapter and dependency.
- [ ] Keep `DateAdapter` interface stable for future libraries.
- [ ] Update README/demos to reference Luxon only.
- Deliverable: Moment-free major release.

## Phase 12 – Distribution (GitHub Actions) (0.5–1 week)

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

- `dateLibrary`: `'moment' | 'luxon'` (default `'moment'` until Phase 10).
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
- [ ] `package.json`: add `luxon`; remove `moment` at Phase 11.

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
- Weekly migration sync until Phase 9 completes.
