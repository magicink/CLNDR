// Public type definitions for CLNDR jQuery plugin.
// Phase 2: initial .d.ts based on README and tests.

// Minimal adapter-native date alias (e.g., Luxon DateTime).
type ClndrDateLike = any

interface ClndrEvent {
  // Common fields used by CLNDR when not using multiDayEvents
  date?: string
  // When multiDayEvents is enabled
  startDate?: string
  endDate?: string
  // Allow arbitrary user data
  [key: string]: any
}

interface ClndrDay {
  day: number
  // Adapter-native date-like value (e.g., Luxon DateTime)
  date: ClndrDateLike
  events: ClndrEvent[]
  classes: string
  // Optional bag for additional flags
  properties?: { [key: string]: any }
}

interface ClndrTargets {
  day?: string
  empty?: string
  nextButton?: string
  todayButton?: string
  previousButton?: string
  nextYearButton?: string
  previousYearButton?: string
}

interface ClndrClasses {
  past?: string
  today?: string
  event?: string
  inactive?: string
  selected?: string
  lastMonth?: string
  nextMonth?: string
  adjacentMonth?: string
}

interface ClndrClickTarget {
  element: Element
  date: ClndrDateLike | null
  events: ClndrEvent[]
}

interface ClndrClickEvents {
  click?: (target: ClndrClickTarget) => void
  today?: (month: ClndrDateLike) => void
  nextYear?: (month: ClndrDateLike) => void
  nextMonth?: (month: ClndrDateLike) => void
  previousYear?: (month: ClndrDateLike) => void
  onYearChange?: (month: ClndrDateLike) => void
  previousMonth?: (month: ClndrDateLike) => void
  onMonthChange?: (month: ClndrDateLike) => void
  nextInterval?: (start: ClndrDateLike, end: ClndrDateLike) => void
  previousInterval?: (start: ClndrDateLike, end: ClndrDateLike) => void
  onIntervalChange?: (start: ClndrDateLike, end: ClndrDateLike) => void
}

interface ClndrLengthOfTime {
  months?: number | null
  days?: number | null
  interval?: number
  // Optional starting point used by some views
  startDate?: ClndrDateLike
}

interface ClndrConstraints {
  startDate?: string | ClndrDateLike
  endDate?: string | ClndrDateLike
}

interface ClndrOptions {
  template?: string
  render?: (data: ClndrTemplateData) => string
  startWithMonth?: string | ClndrDateLike
  weekOffset?: number
  daysOfTheWeek?: string[]
  formatWeekdayHeader?: (day: ClndrDateLike) => string
  targets?: ClndrTargets
  classes?: ClndrClasses
  clickEvents?: ClndrClickEvents
  useTouchEvents?: boolean
  ready?: () => void
  doneRendering?: () => void
  events?: ClndrEvent[]
  dateParameter?: string
  multiDayEvents?: { startDate: string; endDate: string; singleDay?: string }
  showAdjacentMonths?: boolean
  adjacentDaysChangeMonth?: boolean
  forceSixRows?: boolean | null
  trackSelectedDate?: boolean
  selectedDate?: string | null
  ignoreInactiveDaysInSelection?: boolean | null
  lengthOfTime?: ClndrLengthOfTime
  extras?: any
  constraints?: ClndrConstraints | null
  /** Optional visual theme applied to the container. Defaults by mode. */
  theme?: 'default' | 'grid' | 'months' | (string & {})
  /** When true, applies `clndr--mode-*` and `clndr--theme-*` classes to the container. */
  applyThemeClasses?: boolean
  // Adapter selection & i18n surface
  /** Advanced injection: custom adapter implementing the DateAdapter surface */
  dateAdapter?: any
  /** Optional locale forwarded to adapter */
  locale?: string
  /** Optional IANA time zone forwarded to adapter (Luxon) */
  zone?: string
}

interface ClndrTemplateMonthBlock {
  days: ClndrDay[]
  month: ClndrDateLike
}

interface ClndrTemplateData {
  // Shared across modes
  daysOfTheWeek: string[]
  extras: any

  // Month view
  days: ClndrDay[]
  month: string | null
  year: string | number | null
  eventsThisMonth: ClndrEvent[]
  eventsLastMonth: ClndrEvent[]
  eventsNextMonth: ClndrEvent[]

  // Multi-month view
  months: ClndrTemplateMonthBlock[]
  numberOfRows: number

  // Interval views
  intervalStart: ClndrDateLike | null
  intervalEnd: ClndrDateLike | null
  eventsThisInterval: any
}

interface Clndr {
  // Public state and options
  options: ClndrOptions
  element: any

  // Rendering
  render(): void

  // Navigation
  back(options?: { withCallbacks?: boolean }): Clndr
  previous(options?: { withCallbacks?: boolean }): Clndr // alias of back
  forward(options?: { withCallbacks?: boolean }): Clndr
  next(options?: { withCallbacks?: boolean }): Clndr // alias of forward
  previousYear(options?: { withCallbacks?: boolean }): Clndr
  nextYear(options?: { withCallbacks?: boolean }): Clndr
  today(options?: { withCallbacks?: boolean }): void

  // Mutations
  setMonth(
    newMonth: number | string,
    options?: { withCallbacks?: boolean }
  ): Clndr
  setYear(newYear: number, options?: { withCallbacks?: boolean }): Clndr
  setExtras(extras: any): Clndr
  setEvents(events: ClndrEvent[]): Clndr
  addEvents(events: ClndrEvent[], reRender?: boolean): Clndr
  removeEvents(matchingFn: (event: ClndrEvent) => boolean): Clndr

  // Lifecycle
  destroy(): void
}

// jQuery plugin entry point
interface JQuery {
  clndr(options?: ClndrOptions): Clndr
}
