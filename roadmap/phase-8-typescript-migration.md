# Phase 8: Full TypeScript Source of Record

**Status**: In Progress  
**Target Duration**: 2 weeks  
**Goal**: Make TypeScript the complete source of record for CLNDR runtime, removing dependency on legacy jQuery plugin source.

---

## Current State Assessment

### What's Working ✅

- **Build Pipeline**: Rollup successfully compiles TS → ESM/UMD bundles (`dist/clndr.esm.js`, `dist/clndr.umd.js`, `dist/clndr.d.ts`)
- **Test Suite**: All 46 Jest tests passing with high coverage (93%+ across TS modules)
- **Type Definitions**: Complete type definitions in `types/clndr.d.ts`
- **Core TS Modules**: Implemented and tested
  - `src/ts/date-adapter/` - DateAdapter interface + Moment/Luxon implementations
  - `src/ts/config.ts` - Options normalization and weekday label computation
  - `src/ts/state.ts` - Calendar state initialization from options
  - `src/ts/templates.ts` - Template data construction utilities
  - `src/ts/render.ts` - Rendering instruction builders
  - `src/ts/events.ts` - Event binding types

### Current Limitations ❌

- **TS Facade Delegates to Legacy**: `src/ts/facade.ts` still calls `$.fn.clndr()` from the legacy plugin
  ```typescript
  // Current facade.ts - NOT self-sufficient
  export function clndr(element: any, options?: ClndrOptions): Clndr {
    if (typeof ($ as any).fn?.clndr !== 'function') {
      throw new Error('CLNDR: jQuery with clndr plugin is required at runtime')
    }
    const $el: any = element && element.jquery ? element : ($ as any)(element)
    return $el.clndr(options) // ← Delegates to legacy!
  }
  ```
- **Legacy JS Still Required**: `src/clndr.js` (600+ lines) contains the actual runtime implementation
- **Demo Loads Both**: `demo/index.html` loads both UMD bundle AND legacy source
  ```html
  <script src="../dist/clndr.umd.js"></script>
  <script src="../src/clndr.js"></script>
  <!-- ← Still needed! -->
  ```
- **Package Exports Legacy**: `package.json` includes `"./legacy": "./src/clndr.js"` in exports

---

## Phase 8 Deliverables

### Primary Goal

**Single Source of Truth**: The TypeScript implementation in `src/ts/` becomes the complete, self-sufficient CLNDR runtime. The legacy `src/clndr.js` file is removed from the codebase.

### Success Criteria

- [ ] CLNDR core logic implemented entirely in TypeScript
- [ ] TS facade creates calendars without requiring `src/clndr.js`
- [ ] jQuery plugin wrapper (optional) compiled into UMD for backward compatibility
- [ ] All existing tests pass with TS-only runtime
- [ ] Demo works with only `dist/clndr.umd.js` (no legacy source)
- [ ] Legacy `src/clndr.js` deleted from repository
- [ ] Package exports updated to reference only compiled artifacts
- [ ] Documentation updated to reflect TS-first approach

---

## Implementation Plan

### Step 1: Implement Core TypeScript Runtime (4–5 days)

#### 1.1 Create Core Calendar Class

**File**: `src/ts/core.ts`

Responsibilities:

- Instance state management (month, interval, events, selectedDate)
- Public API methods (navigation, mutations, lifecycle)
- Event filtering and processing
- Day object construction
- Constraint validation

Key methods to implement:

```typescript
export class ClndrCore<T = unknown> {
  // State
  private adapter: DateAdapter<T>
  private state: CalendarState<T>
  private options: ClndrOptions
  private events: ClndrEvent[]
  private constraints: ConstraintState

  // Initialization
  constructor(adapter: DateAdapter<T>, options: ClndrOptions)

  // Navigation (return new state, immutable)
  forward(interval?: number): CalendarState<T>
  back(interval?: number): CalendarState<T>
  setMonth(month: number | string): CalendarState<T>
  setYear(year: number): CalendarState<T>
  today(): CalendarState<T>

  // Mutations
  setEvents(events: ClndrEvent[]): void
  addEvents(events: ClndrEvent[]): void
  removeEvents(filterFn: (e: ClndrEvent) => boolean): void
  setExtras(extras: any): void

  // Data generation
  createDaysObject(start: AdapterDate<T>, end: AdapterDate<T>): ClndrDay[]
  buildTemplateData(): ClndrTemplateData

  // Constraint checking
  checkConstraints(): ConstraintState
  isDateInactive(date: AdapterDate<T>): boolean
}
```

**Parity Requirements**:

- Day object structure must match legacy format:
  ```typescript
  {
    day: number,           // 1-31
    date: moment-like,     // adapter.value() for compatibility
    classes: string,       // space-separated class names
    events: ClndrEvent[],
    properties?: {}
  }
  ```
- Class application logic must match legacy rules:
  - `past` - before today
  - `today` - is today
  - `event` - has events
  - `inactive` - outside constraints
  - `selected` - matches selectedDate
  - `last-month` / `next-month` - adjacent month days
  - `adjacent-month` - all adjacent days
- Grid construction must preserve legacy behavior:
  - Default: start on month's 1st, pad with previous month to align week
  - `lengthOfTime.days`: align to `weekOffset` within the anchor week
  - `showAdjacentMonths`: fill or hide adjacent days
  - `forceSixRows`: pad to 42 days when true

#### 1.2 Implement Event Processing

**File**: `src/ts/core.ts` (or extract to `src/ts/events-core.ts`)

Methods:

```typescript
// Add adapter date objects to events for efficient filtering
addDateObjectsToEvents(events: ClndrEvent[]): ClndrEvent[]
addMultiDayDateObjectsToEvents(events: ClndrEvent[]): ClndrEvent[]

// Filter events by date range
filterEventsInRange(
  events: ClndrEvent[],
  start: AdapterDate<T>,
  end: AdapterDate<T>
): ClndrEvent[]

// Find events for a specific day
eventsForDay(day: AdapterDate<T>): ClndrEvent[]
```

**Parity Requirements**:

- Must attach `_clndrStartDateObject` and `_clndrEndDateObject` to events (matches legacy)
- Multi-day event logic must match legacy inclusive range behavior
- Event filtering must handle edge cases (before start, after end, spanning)

#### 1.3 Implement DOM/jQuery Integration Layer

**File**: `src/ts/dom.ts`

Responsibilities:

- Render template with data
- Attach to container element
- Bind click handlers
- Manage DOM lifecycle

```typescript
export class ClndrDOM {
  private element: HTMLElement | JQuery
  private container: HTMLElement
  private core: ClndrCore
  private renderer: TemplateRenderer

  constructor(
    element: HTMLElement | JQuery | string,
    core: ClndrCore,
    renderer: TemplateRenderer
  )

  // Rendering
  render(): void
  destroy(): void

  // Event binding
  private bindEvents(): void
  private handleDayClick(e: Event): void
  private handleNavigation(direction: string): void
}
```

**Parity Requirements**:

- Must support jQuery objects, DOM elements, and selectors
- Click event delegation must match legacy target selectors
- Touch events when `useTouchEvents: true`
- Callback invocation with correct `this` context

#### 1.4 Template Renderer Factory

**File**: `src/ts/templates.ts` (extend existing)

Add:

```typescript
// Create renderer from options (template string or custom render fn)
export function createRenderer(options: ClndrOptions): TemplateRenderer {
  if (typeof options.render === 'function') {
    return options.render
  }

  if (options.template) {
    // Try Underscore/Lodash if available
    if (typeof _ !== 'undefined' && _.template) {
      return _.template(options.template)
    }
    // Fallback to our minimal compiler
    return compile(options.template)
  }

  // Use default template
  return compile(DEFAULT_TEMPLATE)
}
```

---

### Step 2: Update TS Facade to Use Core (1 day)

**File**: `src/ts/facade.ts`

Replace delegation with direct instantiation:

```typescript
import $ from 'jquery'
import { ClndrCore } from './core'
import { ClndrDOM } from './dom'
import { createRenderer } from './templates'
import { normalizeOptions } from './config'
import { createMomentAdapter } from './date-adapter/moment-adapter'
import { createLuxonAdapter } from './date-adapter/luxon-adapter'

export function clndr(element: any, options: ClndrOptions = {}): Clndr {
  // 1. Select adapter
  let adapter: DateAdapter
  if (options.dateAdapter) {
    adapter = options.dateAdapter
  } else {
    const pref =
      options.dateLibrary ||
      (typeof process !== 'undefined' && process.env?.DATE_LIB) ||
      'moment'

    if (pref === 'luxon') {
      adapter = createLuxonAdapter(options.locale, options.zone)
    } else {
      // Import moment from window or require
      const moment =
        options.moment ||
        (typeof window !== 'undefined' && (window as any).moment) ||
        require('moment')
      adapter = createMomentAdapter(options.locale || moment.locale())
    }
  }

  // 2. Normalize options
  const normalized = normalizeOptions(adapter, options)

  // 3. Create core
  const core = new ClndrCore(adapter, normalized.options)

  // 4. Create renderer
  const renderer = createRenderer(normalized.options)

  // 5. Create DOM manager
  const dom = new ClndrDOM(element, core, renderer)

  // 6. Return public API (Clndr interface)
  return createPublicAPI(core, dom, normalized.options)
}

function createPublicAPI(
  core: ClndrCore,
  dom: ClndrDOM,
  options: ClndrOptions
): Clndr {
  return {
    // Instance properties
    options,
    element: dom.element,

    // Rendering
    render() {
      dom.render()
    },

    // Navigation
    forward(opts) {
      core.forward()
      dom.render()
      return this
    },
    next(opts) {
      return this.forward(opts)
    },
    back(opts) {
      core.back()
      dom.render()
      return this
    },
    previous(opts) {
      return this.back(opts)
    },
    nextYear(opts) {
      /* ... */
    },
    previousYear(opts) {
      /* ... */
    },
    today(opts) {
      core.today()
      dom.render()
    },
    setMonth(m, opts) {
      core.setMonth(m)
      dom.render()
      return this
    },
    setYear(y, opts) {
      core.setYear(y)
      dom.render()
      return this
    },

    // Mutations
    setEvents(events) {
      core.setEvents(events)
      dom.render()
      return this
    },
    addEvents(events, reRender) {
      /* ... */
    },
    removeEvents(fn) {
      /* ... */
    },
    setExtras(extras) {
      core.setExtras(extras)
      return this
    },

    // Lifecycle
    destroy() {
      dom.destroy()
    }
  }
}
```

**Testing**: Existing Jest tests should pass with updated facade.

---

### Step 3: Create Optional jQuery Plugin Wrapper (1 day)

**File**: `src/ts/jquery-plugin.ts`

Provides backward compatibility for `$('.cal').clndr()` usage:

```typescript
import $ from 'jquery'
import { clndr as clndrFactory } from './facade'

declare global {
  interface JQuery {
    clndr(options?: ClndrOptions): Clndr
  }
}

// Register the jQuery plugin
export function registerJQueryPlugin(): void {
  if (typeof $ === 'undefined' || !$.fn) {
    console.warn('CLNDR: jQuery not available, skipping plugin registration')
    return
  }

  $.fn.clndr = function (this: JQuery, options?: ClndrOptions): Clndr {
    if (this.length === 0) {
      throw new Error('CLNDR: No element selected')
    }
    if (this.length > 1) {
      throw new Error('CLNDR: Can only initialize one calendar per element')
    }

    // Use the first (and only) element
    return clndrFactory(this[0], options)
  }
}

// Auto-register when loaded as UMD and jQuery is present
if (typeof window !== 'undefined' && (window as any).jQuery) {
  registerJQueryPlugin()
}
```

**Update**: `src/ts/index.ts`

```typescript
export { clndr } from './facade'
export { registerJQueryPlugin } from './jquery-plugin'

// Auto-register in UMD/browser environments
import { registerJQueryPlugin } from './jquery-plugin'
if (typeof window !== 'undefined') {
  registerJQueryPlugin()
}

// ...existing exports...
```

**Result**: UMD build will auto-register `$.fn.clndr` when jQuery is present, maintaining backward compatibility.

---

### Step 4: Add TS Runtime Tests (1 day)

#### 4.1 Pure TS API Test

**File**: `tests/jest/core.runtime.test.ts`

```typescript
import { clndr } from '../../src/ts/facade'
import { createMomentAdapter } from '../../src/ts/date-adapter/moment-adapter'

describe('TS Runtime (no jQuery plugin)', () => {
  it('creates calendar without legacy plugin', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const cal = clndr(div, {
      dateLibrary: 'moment',
      events: [{ date: '2024-01-15', title: 'Test' }]
    })

    expect(cal).toBeDefined()
    expect(cal.options).toBeDefined()
    expect(div.querySelector('.clndr')).toBeTruthy()

    cal.destroy()
  })

  it('navigates forward/back', () => {
    const div = document.createElement('div')
    const cal = clndr(div, { startWithMonth: '2024-01-01' })

    cal.forward()
    // Assert February rendered

    cal.back()
    // Assert January rendered

    cal.destroy()
  })
})
```

#### 4.2 jQuery Plugin Wrapper Test

**File**: `tests/jest/jquery-plugin.test.ts`

```typescript
import $ from 'jquery'
import '../../src/ts/jquery-plugin' // Registers plugin

describe('jQuery Plugin Wrapper', () => {
  it('registers $.fn.clndr', () => {
    expect(typeof $.fn.clndr).toBe('function')
  })

  it('creates calendar via jQuery', () => {
    const $div = $('<div>').appendTo('body')
    const cal = $div.clndr({ dateLibrary: 'moment' })

    expect(cal).toBeDefined()
    expect($div.find('.clndr').length).toBe(1)

    cal.destroy()
  })
})
```

#### 4.3 Parity Validation Test

**File**: `tests/jest/core.parity.test.ts`

Compare TS runtime output to baseline snapshots:

- Day object structure
- Class application
- Grid layout (42 days with forceSixRows, etc.)
- Event filtering
- Multi-month rendering

---

### Step 5: Update Demo (0.5 day)

**File**: `demo/index.html`

**Before**:

```html
<script src="../dist/clndr.umd.js"></script>
<script src="../src/clndr.js"></script>
<!-- Remove this -->
```

**After**:

```html
<script src="../dist/clndr.umd.js"></script>
<!-- jQuery plugin auto-registered by UMD -->
```

**File**: `demo/demo.js`

Test both API styles:

```javascript
// jQuery style (backward compatible)
$('.cal1').clndr({
  /* ... */
})

// Direct TS API
clndr('.cal2', {
  /* ... */
})
```

**Validation**:

- [ ] Calendars render identically to baseline
- [ ] Locale/library switcher works
- [ ] Navigation functions correctly
- [ ] No console errors

---

### Step 6: Remove Legacy Source (0.5 day)

**Critical**: Only proceed after all tests pass!

#### 6.1 Delete Legacy JS

```cmd
del src\clndr.js
```

#### 6.2 Update package.json

**Remove**:

```json
{
  "exports": {
    "./legacy": "./src/clndr.js" // ← Remove this
  },
  "files": [
    "src/clndr.js" // ← Remove this
  ]
}
```

**Keep**:

```json
{
  "exports": {
    ".": {
      "types": "./types/clndr.d.ts",
      "import": "./dist/clndr.esm.js",
      "require": "./dist/clndr.umd.js"
    }
  },
  "main": "dist/clndr.umd.js",
  "module": "dist/clndr.esm.js",
  "types": "types/clndr.d.ts",
  "files": ["dist", "types", "README.md", "LICENSE.md"]
}
```

#### 6.3 Update .gitignore

Ensure `dist/` artifacts are still gitignored (built on publish).

---

### Step 7: Update Documentation (1 day)

#### 7.1 README.md

**Update "Using Bun" section**:

````markdown
### Installation

```shell
bun add @brandontom/luxon-clndr
```
````

### Usage

**ESM (recommended)**:

```typescript
import { clndr } from '@brandontom/luxon-clndr'

const cal = clndr('#calendar', {
  dateLibrary: 'luxon',  // or 'moment'
  events: [...]
})
```

**jQuery Plugin** (backward compatible):

```javascript
<script src="https://cdn.jsdelivr.net/.../jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/.../luxon.min.js"></script>
<script src="node_modules/@brandontom/luxon-clndr/dist/clndr.umd.js"></script>

<script>
  $('.calendar').clndr({ dateLibrary: 'luxon' })
</script>
```

**UMD (browser global)**:

```javascript
<script>
  const cal = clndr('#calendar', { dateLibrary: 'luxon' })
</script>
```

````

**Remove legacy notes**:
- Delete "The TS entry delegates to jQuery's plugin for now" warnings
- Update all examples to show TS-first usage
- Keep jQuery examples for backward compatibility

#### 7.2 Add Migration Guide
**File**: `docs/MIGRATION-v2.md`

Document:
- Breaking changes (if any)
- Upgrade path from 1.x
- jQuery plugin still available but not required
- Date library selection via `dateLibrary` option

---

### Step 8: CI/Build Verification (0.5 day)

Run full validation suite:

```cmd
bun run type-check
bun run build:ts
bun run build
bun run test -- --coverage
bun run smoke
````

**Success Criteria**:

- [x] TypeScript compiles without errors
- [x] Rollup produces clean bundles
- [x] All Jest tests pass
- [x] Coverage stays above 90%
- [x] Smoke tests render correctly
- [x] No console errors in demos

---

## Testing Strategy

### Unit Tests (Jest)

- [x] Existing adapter tests (already passing)
- [ ] New `ClndrCore` tests (navigation, mutations, day generation)
- [ ] New `ClndrDOM` tests (rendering, event binding)
- [ ] jQuery plugin wrapper tests
- [ ] Parity tests comparing TS output to legacy behavior

### Integration Tests

- [ ] Demo visual regression (compare to baseline screenshots)
- [ ] Smoke tests with both Moment and Luxon
- [ ] Multi-locale rendering tests

### Manual Testing Checklist

- [ ] Create calendar via TS API (`clndr(el, opts)`)
- [ ] Create calendar via jQuery plugin (`$(el).clndr(opts)`)
- [ ] Navigate forward/backward
- [ ] Switch locales
- [ ] Toggle date library (Moment ↔ Luxon)
- [ ] Add/remove events
- [ ] Test constraints (min/max dates)
- [ ] Test multi-day events
- [ ] Test week offset
- [ ] Test forceSixRows
- [ ] Test selectedDate tracking

---

## Rollback Plan

If critical issues arise:

1. **Revert commits** removing `src/clndr.js`
2. **Restore package.json** `./legacy` export
3. **Keep TS implementation** as experimental
4. **Document blockers** for future resolution

---

## Dependencies & Blockers

### Prerequisites (Already Complete) ✅

- [x] DateAdapter interface stable
- [x] Moment and Luxon adapters tested
- [x] Config normalization working
- [x] State initialization working
- [x] Test infrastructure in place

### External Dependencies

- jQuery (peer dependency, required for plugin wrapper)
- Moment or Luxon (peer dependencies, runtime date library)
- Underscore/Lodash (optional, for default template rendering)

### Potential Blockers

- **Edge cases in legacy behavior**: Day class calculation, constraint logic, multi-day events
- **Template compatibility**: Ensure all template variables match legacy
- **Callback signatures**: `this` context and argument order must match
- **DOM event handling**: Click delegation and touch events

---

## Success Metrics

### Code Quality

- [ ] Test coverage ≥ 90%
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Bundle size ≤ legacy (or document increase)

### Functional Parity

- [ ] All existing demos work unchanged
- [ ] Visual regression tests pass
- [ ] No breaking changes to public API
- [ ] Callbacks fire with correct arguments and context

### Documentation

- [ ] README updated with TS examples
- [ ] Migration guide published
- [ ] Type definitions accurate
- [ ] Inline code comments present

---

## Timeline Estimate

| Task                     | Duration    | Dependencies        |
| ------------------------ | ----------- | ------------------- |
| 1. Implement ClndrCore   | 3 days      | None                |
| 2. Implement ClndrDOM    | 1 day       | ClndrCore           |
| 3. Update facade         | 0.5 day     | ClndrCore, ClndrDOM |
| 4. jQuery plugin wrapper | 0.5 day     | Facade              |
| 5. Add TS runtime tests  | 1 day       | All TS impl         |
| 6. Update demo           | 0.5 day     | Working runtime     |
| 7. Remove legacy source  | 0.5 day     | All tests passing   |
| 8. Update docs           | 1 day       | Complete impl       |
| 9. CI verification       | 0.5 day     | All above           |
| **Buffer**               | 1.5 days    | Debugging, fixes    |
| **Total**                | **10 days** | ~2 weeks            |

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Create GitHub issues** for each major task (Steps 1-8)
3. **Set up feature branch**: `feat/phase-8-ts-runtime`
4. **Begin implementation** with Step 1.1 (ClndrCore class)
5. **Incremental PRs**: Merge small, tested chunks to minimize risk
6. **Daily standup**: Track progress and blockers

---

## Questions / Open Issues

- [ ] Should we maintain a compiled "legacy wrapper" UMD even after removing source? (Answer: Yes, via jquery-plugin.ts in UMD)
- [ ] Bundle size impact? (Measure after ClndrCore implementation)
- [ ] Need IE11 support? (Affects build targets and polyfills)
- [ ] Deprecation warnings for removed features? (None planned; this is internal refactor)

---

## Sign-off

**Phase 8 Complete When**:

- [ ] All checklist items marked done
- [ ] `src/clndr.js` deleted from repo
- [ ] All tests passing (Jest + smoke)
- [ ] Demo works with TS-only runtime
- [ ] README updated
- [ ] Tagged as RC (release candidate) in git

**Approver**: ******\_******  
**Date**: ******\_******
