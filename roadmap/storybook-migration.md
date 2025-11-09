# Storybook Migration Plan

This plan replaces the standalone demo and manual test pages (`demo/index.html`, `tests/test.html`) with a Storybook-driven developer and docs experience, while preserving all current scenarios and enabling accessibility and interaction testing.

## Why Storybook

- Consolidate demos/tests into discoverable, versioned stories
- Interactive controls (args) to vary `ClndrOptions` without editing code
- Built-in addons: Accessibility, Actions, Controls, Docs
- CI-friendly static build + optional visual testing

## Current Inventory (to port)

- Demo: `demo/index.html`, `demo/demo.js`, styles `demo/css/clndr.css`
- Manual tests: `tests/test.html` + `tests/test.js` (scenarios include: adjacent months, custom template, events, callbacks, multiday, constraints, API, six rows, custom classes, multi‑month, one/two‑week intervals, selected date variants, weekOffset, custom targets, formatWeekdayHeader)
- UMD path: `dist/clndr.umd.js` is currently used in pages; for Storybook we will import ESM (`src/ts/index.ts` or package root)

## Approach

- Use Storybook 8 with the HTML renderer + Vite builder
  - `@storybook/html-vite`, `@storybook/addon-essentials`, `@storybook/addon-a11y`, `@storybook/addon-interactions`, `@storybook/test`
- Import CLNDR from source for faster iteration: `import { clndr, DEFAULT_TEMPLATE } from '../src/ts'`
  - jQuery is already a dependency; bundler provides it
- Include demo CSS globally in preview
- For templates requiring loops, use Underscore templates (install `underscore`) or compile once within stories and pass as `render`
- Write plain-HTML stories that render a container element and instantiate CLNDR imperatively

## Setup Steps

1. Install dev dependencies

- `storybook`, `@storybook/html`, `@storybook/html-vite`
- `@storybook/addon-essentials`, `@storybook/addon-a11y`, `@storybook/addon-interactions`, `@storybook/test`
- `underscore` (for story templates parity)

2. Add config

- `.storybook/main.ts`
  - framework: `@storybook/html-vite`
  - addons: essentials, a11y, interactions
  - stories: `stories/**/*.stories.@(ts|js)`
- `.storybook/preview.ts`
  - import `demo/css/clndr.css`
  - set `parameters.a11y` defaults, `parameters.actions`, `parameters.controls`

3. Story utilities

- `stories/utils.ts` helper to:
  - create and return a fresh container element per story render
  - instantiate `clndr(container, options)`
  - optional logger to pipe callbacks into Storybook Actions

4. Initial stories (parity with current pages)

- `stories/Basic.stories.ts`
  - Default month view using `DEFAULT_TEMPLATE`
  - Args: `weekOffset`, `showAdjacentMonths`, `adjacentDaysChangeMonth`
- `stories/Events.stories.ts`
  - Single/multiday events; performance variant with many events
- `stories/Callbacks.stories.ts`
  - Wire CLNDR `clickEvents` to Storybook Actions
- `stories/Constraints.stories.ts`
  - Start/end constraints across current/prev/next months
- `stories/Layout.stories.ts`
  - `forceSixRows`, `classes` override, custom targets.day
- `stories/Intervals.stories.ts`
  - `lengthOfTime.days` and `lengthOfTime.months` variants (one‑week/two‑week, three‑months)
- `stories/Selection.stories.ts`
  - `trackSelectedDate`, `selectedDate`, `ignoreInactiveDaysInSelection`
- `stories/I18n.stories.ts`
  - `locale`, `formatWeekdayHeader`

Notes

- For multi‑month/week templates, reuse strings from `tests/test.html` or define inline. Compile with `_.template(...)` and pass via `render`.
- Keep selector/class tokens used by CLNDR (e.g., `.day`, `.calendar-day-YYYY-MM-DD`).

## Accessibility

- Enable `@storybook/addon-a11y` globally
- Add a dedicated `stories/Accessibility.stories.ts` that uses the accessible template example from `docs/ACCESSIBILITY.md`
- Later phases: add interaction tests for keyboard navigation once implemented in DOM layer

## CI & Scripts

- Add scripts to `package.json`:
  - `storybook`: `storybook dev -p 6006`
  - `storybook:build`: `storybook build`
  - Optional: `test-storybook` with `@storybook/test` runner
- GitHub Pages (optional): publish `storybook-static/` via CI
- Update smoke tests:
  - Option A (quick): point Puppeteer to `storybook-static/index.html` and navigate to key stories (URLs like `iframe.html?id=...`)
  - Option B: replace with `@storybook/test` + Playwright assertions for core selectors

## Decommission Plan

- After story parity is verified:
  - Remove `demo/index.html`, `demo/demo.js`
  - Remove `tests/test.html` and repurpose coverage with Storybook tests
  - Update `README.md` to reference Storybook for live docs and local development
  - Update CI `ci:check` to build Storybook and run its test runner

## Risks & Mitigations

- jQuery/UMD vs ESM
  - Use ESM `clndr` import in stories to avoid UMD globals
- Template engine
  - Underscore is required only for story templates using loops; internal default template doesn’t need it
- CSS parity
  - Import `demo/css/clndr.css` in preview to maintain visual parity; add a11y focus styles as needed

## Task Checklist

- [ ] Add Storybook + addons dev dependencies
- [ ] Add `.storybook/main.ts` and `.storybook/preview.ts` (import demo CSS)
- [ ] Create `stories/utils.ts` (container + init helper)
- [ ] Port demo scenarios into `Basic`, `Events`, `Callbacks`, `Constraints`, `Layout`, `Intervals`, `Selection`, `I18n`
- [ ] Wire Actions addon to show callbacks
- [ ] Add a11y addon and accessible template story
- [ ] Add `storybook` and `storybook:build` scripts; optional test runner
- [ ] Repoint smoke tests to Storybook or adopt `@storybook/test`
- [ ] Remove demo/test HTML after parity; update README and CI

## Example Story (HTML renderer)

```ts
// stories/Basic.stories.ts
import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE, createRenderer } from '../src/ts'

const meta: Meta = {
  title: 'CLNDR/Basic',
  render: args => {
    const el = document.createElement('div')
    el.style.maxWidth = '600px'
    const api = clndr(el, {
      ...args,
      template: DEFAULT_TEMPLATE
    })
    // expose for debugging
    ;(el as any).__api = api
    return el
  },
  argTypes: {
    weekOffset: { control: 'number' },
    showAdjacentMonths: { control: 'boolean' },
    adjacentDaysChangeMonth: { control: 'boolean' }
  },
  args: {
    weekOffset: 0,
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: false
  }
}
export default meta
export const Default: StoryObj = {}
```

---

This plan preserves all current functionality while moving demos/tests into a modern, maintainable Storybook setup that supports a11y, interactivity, and CI integration.
