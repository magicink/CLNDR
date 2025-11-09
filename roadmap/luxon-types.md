# Luxon Type Definitions – Investigation & Plan

## Findings

- Installed version: `luxon@3.7.2` (package exports JS only; no bundled `.d.ts`).
- DefinitelyTyped provides types: `@types/luxon@3.7.1` (current as of `npm view`).
- Repo contains a local shim at `types/luxon.d.ts` that declares a minimal subset of Luxon’s API (DateTime, Info) used by the adapter and tests.
- tsconfig uses `"moduleResolution": "Bundler"` with `ts-jest` for tests. The shim comment notes previous issues resolving Luxon’s types under this resolution strategy.

## Current State

- The local shim avoids “Cannot find module 'luxon' or its corresponding type declarations” during `tsc` and `ts-jest` runs without adding `@types/luxon`.
- It intentionally models only the methods/properties required by our code (e.g., `toFormat`, `toISO`, `startOf`, `endOf`, `plus`, `minus`, `weekday`, `day`, `daysInMonth`, `Info.weekdays`).

## Recommendation

- Prefer official community-maintained types over a custom shim.
- Replace `types/luxon.d.ts` with `@types/luxon` as a dev dependency.
- Keep `moduleResolution: Bundler` (it still consults `@types` packages) unless we encounter ts-jest edge cases; if so, use a test-only tsconfig override.

## Migration Plan

1. Add types dependency

- `npm i -D @types/luxon` (or yarn/pnpm/bun equivalent)

2. Remove the local shim

- Delete `types/luxon.d.ts` to prevent declaration merging/redeclaration conflicts with `@types/luxon`.

3. Verify builds/tests

- `npm run type-check`
- `npm test`

4. Optional: test-only tsconfig (if needed)

- If `ts-jest` has resolution issues under `Bundler`, add a `tsconfig.test.json` with `"moduleResolution": "NodeNext" | "Node"` and reference it in `jest.config.ts` via ts-jest transformer options.

## Risks

- Declaration conflicts if the shim remains alongside `@types/luxon` (both declare `module 'luxon'`).
- Historic ts-jest + Bundler resolution quirks; mitigated by test-specific tsconfig override.

## Decision

- Adopt `@types/luxon` and remove the shim. Only retain the shim if we must support environments without devDependencies (not our case) or if unavoidable CI issues arise (then guard it behind a separate build profile).
