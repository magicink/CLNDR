# CSS Theming & Mode Refactor Plan

This plan removes the need for external wrapper classes like `cal1`, `cal2`, and `cal3`,
replacing them with first‑class, self‑applied classes on the CLNDR container. It preserves
backwards compatibility during a deprecation window.

## Goals

- No wrapper required for styling (works out‑of‑the‑box).
- Clear separation of structure vs. theme.
- Container reflects its current view mode (table/month, days interval, months interval).
- Backwards‑compatible with existing `.cal*` wrappers for at least one release.

## Approach

- Base + Themes
  - Add a small, neutral base layer under `.clndr` that covers structure (controls, grid/table, cells).
  - Move visual styling into opt‑in theme classes applied directly on the CLNDR container:
    - `.clndr--theme-default` (table template, current "cal1")
    - `.clndr--theme-grid` (days interval grid, current "cal2")
    - `.clndr--theme-months` (multi‑month grid, current "cal3")

- Mode Classes (auto)
  - Add invariant “mode” classes based on current view to help target structural differences:
    - Month/table: `.clndr.clndr--mode-table`
    - Days interval: `.clndr.clndr--mode-grid`
    - Months interval: `.clndr.clndr--mode-months`

- Options Surface
  - Add `theme?: 'default' | 'grid' | 'months' | string` to `ClndrOptions` so consumers can override theme.
  - Default theme by mode: table → `default`, grid → `grid`, months → `months`.

- DOM Application
  - In `src/ts/dom.ts` (constructor), after creating `this.container`:
    - Detect mode from `options.lengthOfTime` (days → grid, months → months, else table).
    - Compute theme = `options.theme ?? defaultThemeForMode`.
    - Apply classes: `clndr--mode-${mode}` and `clndr--theme-${theme}`.
  - If we ever support changing `lengthOfTime` at runtime, re‑apply mode/theme classes when options change.

- CSS Refactor (non‑breaking)
  - Add new selectors first, then keep legacy `.cal*` wrappers as aliases during the deprecation period.
    - Example mappings:
      - `.clndr.clndr--theme-default .clndr-table, .cal1 .clndr .clndr-table { … }`
      - `.clndr.clndr--theme-grid .clndr-grid, .cal2 .clndr .clndr-grid { … }`
      - `.clndr.clndr--theme-months .clndr-grid, .cal3 .clndr .clndr-grid { … }`
  - Introduce CSS variables for common tokens on `.clndr` for easy theming:
    - Colors (accent, muted), spacing (gaps), borders, focus ring.

- Storybook & Demo
  - Update stories to remove wrapper classes and rely on theme/mode.
    - Basic: default table template → auto `clndr--mode-table` + `clndr--theme-default`.
    - Grid: days interval with grid template → `clndr--mode-grid` + `clndr--theme-grid`.
    - Months: multi‑month grid → `clndr--mode-months` + `clndr--theme-months`.
  - Keep existing demo pages working via alias selectors; remove wrappers after deprecation.

## Rollout & Deprecation

- vNext (minor):
  - Ship container mode/theme classes and updated CSS with `.cal*` aliases.
  - Document new classes and recommend removing wrappers.
- vNext+1 (minor or major):
  - Remove `.cal*` aliases once ecosystem has migrated.

## Tasks

- [ ] Add `theme?: 'default' | 'grid' | 'months' | string` to `ClndrOptions` (types/clndr.d.ts).
- [ ] Apply `clndr--mode-*` and `clndr--theme-*` classes in `src/ts/dom.ts`.
- [ ] Refactor `src/css/clndr.css` selectors to use new classes; keep `.cal*` as aliases.
- [ ] Introduce CSS variables under `.clndr` and adopt them in theme rules.
- [ ] Update README (Styles section) and MIGRATION.md with usage + deprecation notes.
- [ ] Update Storybook stories to remove wrappers; add Grid and Months stories.
- [ ] (Optional) Add a DOM test asserting the presence of mode/theme classes.

## Risks & Mitigations

- Selector specificity regressions → Keep aliases during transition; add visual regression checks in Storybook.
- Consumer overrides relying on `.cal*` → Document new classes and variables; provide mapping in MIGRATION.md.
- Future mode changes at runtime → Encapsulate class application in a helper to allow re‑evaluation if needed.

## Open Questions

- Do we want a lightweight second theme (e.g., dark) out of the box to showcase variables?
- Should we publish the CSS as multiple files (base + themes) for selective inclusion?
