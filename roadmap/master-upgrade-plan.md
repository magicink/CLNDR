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
- [ ] Add minimal smoke tests and CI wiring; full Jest harness in Phase 3.
- Deliverable: Passing CI with compiling TS scaffold; Husky + lint-staged active and commit messages validated against Conventional Commits.

## Phase 2 – Type Definitions & Facade (1–2 weeks)

- [ ] Author `.d.ts` for public CLNDR API based on README and tests.
- [ ] Add `src/ts/facade.ts` exporting the same factory/API, delegating to legacy JS initially.
- [ ] Publish types so consumers benefit immediately without behavior changes.
- Deliverable: Minor release with official type definitions.

## Phase 3 – Test Harness (Jest) (0.5–1 week)

Establish a modern unit test stack and DOM snapshot testing.

- [ ] Add Jest with TypeScript support (`jest`, `ts-jest`, `@types/jest`).
- [ ] Configure `jest.config.ts` with `jsdom` environment and coverage thresholds.
- [ ] Create test utilities for DOM rendering and snapshot helpers.
- [ ] Add scripts: `test`, `test:watch`, `test:cov` and integrate in CI.
- [ ] Parameterize adapter under test via env (e.g., `DATE_LIB=moment|luxon`); default to Moment for now.
- [ ] Seed unit tests for `config`, `state`, and façade; add render snapshots for the demo template.
- Deliverable: Green Jest runs with baseline snapshots and coverage reporting.

## Phase 4 – Build Pipeline (Rollup) (0.5–1 week)

Adopt Rollup for consistent ESM/UMD outputs and type bundles.

- [ ] Add `rollup.config.mjs` producing `dist/clndr.esm.js`, `dist/clndr.umd.js`, and sourcemaps.
- [ ] Use plugins: `@rollup/plugin-node-resolve`, `@rollup/plugin-commonjs`, `@rollup/plugin-typescript` (or `rollup-plugin-typescript2`), optional `rollup-plugin-terser`.
- [ ] Mark externals: `jquery`, `moment`, `luxon`; verify peerDependency treatment.
- [ ] Generate `.d.ts` bundle (via Rollup `dts` or `tsc` emit) and verify type resolution.
- [ ] Add `build`, `build:prod`, and size-check script; integrate into CI.
- [ ] Keep Grunt tasks during transition; switch demos/docs to Rollup outputs when stable.
- [ ] Remove LESS: replace `demo/css/clndr.less` with committed CSS (or small PostCSS pipeline); drop `less`/`grunt-contrib-less` and update demos.
- [ ] Remove Grunt: migrate uglify/watch to Rollup + Terser; delete `Gruntfile.js` and related devDependencies.
- Deliverable: Reproducible ESM/UMD builds via Rollup with types and sourcemaps.

## Phase 5 – Distribution (GitHub Actions) (0.5–1 week)

Automate build, test, and release workflows.

- [ ] Add `.github/workflows/ci.yml` to run on PRs and pushes:
  - Jobs: lint, build (Rollup), test (Jest) with matrix on Node LTS and `DATE_LIB=moment|luxon`.
  - Cache dependencies and Jest cache; upload coverage; store build artifacts.
- [ ] Add `.github/workflows/release.yml` triggered on tags `v*`:
  - Build and test, generate artifacts, publish to npm (with provenance) and create GitHub Release with changelog.
  - Mark externals and attach `dist/*`, `*.map`, and `.d.ts` bundle as release assets.
- [ ] Optional: adopt Changesets or semantic-release for versioning and changelog generation.
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
- [ ] `moment-adapter.ts`: adapter implemented against current behavior.
- [ ] Refactor core to consume only the adapter; remove direct Moment calls from core modules.
- Deliverable: `src/clndr.js` delegates to TS modules; Moment works via adapter.

## Phase 7 – Luxon Adapter (1 week)

- [ ] Implement `luxon-adapter.ts` using Luxon `DateTime`.
- [ ] Add config: `dateLibrary: 'moment' | 'luxon'` (default `'moment'`) and advanced `dateAdapter` injection.
- [ ] Ensure locale/zone: integrate Luxon `Settings.defaultLocale`/`defaultZone` with user config.
- [ ] Map/normalize formatting tokens inside adapter to preserve existing templates.
- [ ] Parity tests for `YYYY-MM-DD`, day labels, month boundaries, and calendar grid.
- Deliverable: Opt-in Luxon support with green tests.

## Phase 8 – Dual Runtime & Validation (1–2 weeks)

- [ ] CI matrix runs full suite with both adapters; snapshots must match.
- [ ] Demo toggle to switch libraries at runtime for manual testing.
- [ ] Document migration notes and subtle differences (invalid dates, DST boundaries).
- [ ] Publish minor release with Luxon opt-in and solicit feedback.
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

## Configuration

- `dateLibrary`: `'moment' | 'luxon'` (default `'moment'` until Phase 10).
- `dateAdapter`: custom adapter injection for power users/testing.
- Respect `locale`, `weekOffset`, and timezone settings via adapter hooks.

## Acceptance Checklist

- [ ] Rollup builds produce UMD/ESM artifacts used by demos/tests.
- [ ] Public API is typed and matches current README/tests.
- [ ] Core uses `DateAdapter` only (no direct Moment/Luxon in modules).
- [ ] Tests pass under both adapters with matching DOM snapshots.
- [ ] Jest coverage thresholds met; smoke and snapshot tests stable.
- [ ] Demo parity verified across locales and week offsets.
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
