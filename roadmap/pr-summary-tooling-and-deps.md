# PR Summary: Tooling Bootstrap + Dependency Updates

Date: 2025-11-08

## Summary

- Phase 1 (Tooling) kickoff complete:
  - Add TypeScript config and scaffold (`tsconfig.json`, `src/ts/index.ts`).
  - Migrate to ESLint v9 flat config (`eslint.config.mjs`) with TS support.
  - Add Prettier config and ignores.
  - Add Husky hooks (`pre-commit`, `commit-msg`) and lint-staged; remove deprecated Husky sourcing.
  - Add commitlint (Conventional Commits) configuration.
- Dependency updates via npm-check-updates (latest stable ranges applied) and installed with Bun.

## Scripts

- `bun run type-check` – TypeScript type checking
- `bun run build:ts` – TS compile to `dist/`
- `bun run lint` / `bun run lint:fix` – ESLint
- `bun run format` / `bun run format:check` – Prettier

## Follow-ups

- Phase 1: introduce additional TS modules under `src/ts/` as we begin facade/types work.
- Phase 4: Remove LESS and Grunt after Rollup pipeline is ready.

## Notable Changes

- ESLint v9 flat config supersedes legacy `.eslintrc.json` (left in repo but unused).
- Hooks do not source the deprecated Husky shim; they call tools directly.
