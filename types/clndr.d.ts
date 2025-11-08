// Public type definitions for CLNDR jQuery plugin.
// Phase 2: initial .d.ts based on README and tests.

// Minimal moment-like alias to avoid external typings for now.
type ClndrMoment = any

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
  date: ClndrMoment // moment-like instance
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
  date: ClndrMoment | null
  events: ClndrEvent[]
}

interface ClndrClickEvents {
  click?: (target: ClndrClickTarget) => void
  today?: (month: ClndrMoment) => void
  nextYear?: (month: ClndrMoment) => void
  nextMonth?: (month: ClndrMoment) => void
  previousYear?: (month: ClndrMoment) => void
  onYearChange?: (month: ClndrMoment) => void
  previousMonth?: (month: ClndrMoment) => void
  onMonthChange?: (month: ClndrMoment) => void
  nextInterval?: (start: ClndrMoment, end: ClndrMoment) => void
  previousInterval?: (start: ClndrMoment, end: ClndrMoment) => void
  onIntervalChange?: (start: ClndrMoment, end: ClndrMoment) => void
}

interface ClndrLengthOfTime {
  months?: number | null
  days?: number | null
  interval?: number
  // Optional starting point used by some views
  startDate?: ClndrMoment
}

interface ClndrConstraints {
  startDate?: string | ClndrMoment
  endDate?: string | ClndrMoment
}

interface ClndrOptions {
  template?: string
  render?: (data: ClndrTemplateData) => string
  startWithMonth?: string | ClndrMoment
  weekOffset?: number
  daysOfTheWeek?: string[]
  formatWeekdayHeader?: (day: ClndrMoment) => string
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
  // Allow consumers to pass a configured moment instance
  moment?: ClndrMoment | null
}

interface ClndrTemplateMonthBlock {
  days: ClndrDay[]
  month: ClndrMoment
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
  intervalStart: ClndrMoment | null
  intervalEnd: ClndrMoment | null
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
