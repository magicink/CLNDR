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

## Phase 5 – Module Extraction + Adapter Intro (2–3 weeks) ✅

Extract focused TS modules and introduce the `DateAdapter` boundary.

Status: TS modules and Moment adapter are implemented under `src/ts`. Legacy `src/clndr.js` now consults the adapter (when the UMD bundle is present) for initial state and weekday labels, preserving legacy behavior and enabling progressive adoption.

- Deliverable: `src/clndr.js` delegates to TS modules when available (UMD global `clndr`), using adapter-backed weekday labels and initial state. Falls back to legacy path when adapter bundle isn’t present.

## Phase 6 – Luxon Adapter (1 week) ✅

- Deliverable: Opt-in Luxon support with green tests.

## Phase 7 – Dual Runtime & Validation (1–2 weeks)

- [ ] Publish minor release with Luxon opt-in and solicit feedback. (pending)
- Deliverable: Stable opt-in Luxon release.

## Phase 8 – Full TypeScript Source of Record (2 weeks)

- [ ] Implement façade entirely in TS; compile to UMD/ESM.
- [ ] Delete legacy JS source after parity passes; keep compatibility build artifacts.
- [ ] Update docs/demos/tests to reference the TS entry.
  - Demo/tests load `dist/clndr.umd.js` and, if needed, `dist/clndr.js` (compat); do not load `src/clndr.js`.
- [ ] Wire package exports and published files.
  - Set `exports["./legacy"]` to `dist/clndr.js`; remove `src/clndr.js` from published `files`.
  - Ensure `main`/`module`/`types` point to `dist/clndr.umd.js`, `dist/clndr.esm.js`, and `dist/clndr.d.ts`.
- Deliverable: Major-version RC built from TypeScript with TS-first runtime and a compatible jQuery wrapper.

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

- [ ] No runtime/docs/demo/tests reference to `src/clndr.js`; only `dist/*` artifacts are loaded.
- [ ] `exports["./legacy"]` points to `dist/clndr.js`; `src/clndr.js` not included in published files.
- [ ] TS facade no longer delegates to the jQuery plugin; chaining available via the compatibility wrapper.

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
