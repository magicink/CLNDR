# CLNDR TypeScript Migration & Modular Refactor Roadmap

## Goals
- Replace the monolithic `src/clndr.js` implementation with typed, testable TypeScript modules without breaking the public API.
- Improve maintainability by extracting rendering, scheduling, and state management concerns into focused files.
- Preserve existing demo behavior and npm/UMD builds while laying groundwork for future features.

## Guiding Principles
1. Keep releases backwards-compatible by shipping parallel JS bundles until the TypeScript build is trusted.
2. Use incremental conversions: wrap existing logic with type definitions before rewriting behavior.
3. Favor pure functions and small modules (<=200 lines) with clear dependencies.
4. Every refactor must land with tests (Jest/Tape) that prove parity with legacy behavior.

## Phase 0 – Discovery & Baseline (1 week)
- [ ] Audit `src/clndr.js` to map major responsibility blocks (init/config parsing, template rendering, date math, event binding, API surface).
- [ ] Tag any implicit globals, DOM assumptions, and moment.js usage; document in `roadmap/notes.md`.
- [ ] Capture runtime snapshots via the demo app and smoke-test suite to serve as regression baselines.
- **Deliverable:** Architecture diagram highlighting modules to be split.

## Phase 1 – Tooling Bootstrap (1 week)
- [ ] Add TypeScript, ts-node, and eslint/prettier rules; configure `tsconfig.json` for incremental builds targeting ES2018.
- [ ] Introduce `src/ts/` entry folder and wire build pipeline: `tsc` → `dist/clndr.js` (compiled) alongside current Grunt tasks.
- [ ] Add type-aware tests (Jest) and configure CI to run both legacy tests and new TS suite.
- **Deliverable:** Passing CI with TypeScript compiling empty scaffold.

## Phase 2 – Type Definitions & Facade (1–2 weeks)
- [ ] Author `.d.ts` that describe the public CLNDR API (options, events, methods) based on README and `tests/` usage.
- [ ] Create `src/ts/facade.ts` that exports the same factory/API but defers implementation to legacy JS via wrappers.
- [ ] Update package exports so consumers can opt into the TypeScript definitions immediately.
- **Deliverable:** Published minor version with official type definitions and no behavioral change.

## Phase 3 – Module Extraction (2–3 weeks)
Break the legacy file into focused TS modules while keeping façade stable.
- [ ] `config.ts`: option normalization, defaults, validation.
- [ ] `state.ts`: calendar state (current month, events, selected dates) with pure update helpers.
- [ ] `templates.ts`: Handlebars/underscore template compilation utilities.
- [ ] `render.ts`: DOM rendering + diffing helpers, returns minimal mutation instructions.
- [ ] `events.ts`: DOM event binding/unbinding, exposes typed callbacks.
- [ ] `date-utils.ts`: moment/dayjs abstraction to ease future dependency swap.
Migration approach per module:
  1. Move corresponding logic from `clndr.js` into TypeScript module, exporting functions consumed by façade.
  2. Add focused unit tests for the module.
  3. Remove duplicated logic from legacy file, leaving thin bridge that calls TS output.
- **Deliverable:** `src/clndr.js` shrinks to <300 lines delegating to TS modules.

## Phase 4 – Full TypeScript Source of Record (2 weeks)
- [ ] Rewrite façade so it is implemented entirely in TypeScript and compiled to UMD/ESM outputs.
- [ ] Delete legacy JS source after parity tests pass; keep compatibility build artifacts.
- [ ] Update docs, demos, and build scripts to reference the new entry point.
- [ ] Expand tests to cover CLI/demos plus snapshot tests for templating.
- **Deliverable:** Major-version release candidate built from TypeScript.

## Phase 5 – Rollout & Cleanup (1 week)
- [ ] Beta publish release tagged `next`, solicit feedback from integrators.
- [ ] Address API pain points, finalize migration notes, and document new module boundaries in README.
- [ ] Remove temporary shims, deprecated options, and TODOs created during migration.
- **Deliverable:** Stable TypeScript release with clear upgrade guide.

## Tracking & Ownership
- Add issues per phase/milestone in GitHub Projects.
- Assign module leads to keep code reviews tight and ensure design consistency.
- Hold weekly migration sync until Phase 4 completes.

