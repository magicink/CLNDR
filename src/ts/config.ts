import { DateAdapter, rotate } from './date-adapter/adapter'

/**
 * Result of options normalization including derived weekday labels.
 */
export interface NormalizedConfig {
  options: ClndrOptions
  daysOfTheWeek: string[]
}

/** @internal Default target selectors used by CLNDR. */
const DEFAULT_TARGETS: Required<NonNullable<ClndrOptions['targets']>> = {
  day: 'day',
  empty: 'empty',
  nextButton: 'clndr-next-button',
  todayButton: 'clndr-today-button',
  previousButton: 'clndr-previous-button',
  nextYearButton: 'clndr-next-year-button',
  previousYearButton: 'clndr-previous-year-button'
}

/** @internal Default CSS class names for day states. */
const DEFAULT_CLASSES: Required<NonNullable<ClndrOptions['classes']>> = {
  past: 'past',
  today: 'today',
  event: 'event',
  inactive: 'inactive',
  selected: 'selected',
  lastMonth: 'last-month',
  nextMonth: 'next-month',
  adjacentMonth: 'adjacent-month'
}

/**
 * Compute weekday header labels.
 *
 * Priority:
 * 1) If `options.daysOfTheWeek` is provided (length 7), rotate by
 *    `weekOffset` and return.
 * 2) Otherwise, derive labels from the adapter via `weekdayLabels('short')`
 *    and rotate by `weekOffset`.
 * 3) If `formatWeekdayHeader` callback is provided, call it for each header
 *    passing the adapter-native date (e.g., moment) representing the i-th
 *    weekday relative to the locale-first day within the current week.
 */
export function computeWeekdayLabels(
  adapter: DateAdapter,
  options: ClndrOptions
): string[] {
  const weekOffset = options.weekOffset ?? 0
  if (options.daysOfTheWeek && options.daysOfTheWeek.length === 7) {
    return rotate(options.daysOfTheWeek, weekOffset)
  }

  // Use adapter-provided labels, rotated by weekOffset.
  // Choose 'narrow' to preserve legacy default single-letter headers.
  const labels = adapter.weekdayLabels('narrow')
  let rotated = rotate(labels, weekOffset)

  if (typeof options.formatWeekdayHeader === 'function') {
    // If provided, allow per-day formatting callback using adapter dates.
    const start = adapter.now().startOf('week')
    rotated = rotated.map((_, idx) => {
      const d = adapter.setWeekday(start, idx)
      // The legacy callback expects moment-like object; pass native value.
      return options.formatWeekdayHeader!(d.value() as any)
    })
  }
  return rotated
}

/**
 * Normalize and default CLNDR options using the provided adapter.
 *
 * - Fills in default `targets` and `classes`.
 * - Ensures stable defaults for booleans and nullable values.
 * - Computes `daysOfTheWeek` using adapter + rotation and user callback.
 */
export function normalizeOptions(
  adapter: DateAdapter,
  inOptions: ClndrOptions = {}
): NormalizedConfig {
  const o: ClndrOptions = {
    weekOffset: inOptions.weekOffset ?? 0,
    showAdjacentMonths: true,
    trackSelectedDate: false,
    dateParameter: 'date',
    template: undefined,
    render: undefined,
    startWithMonth: undefined,
    daysOfTheWeek: undefined,
    formatWeekdayHeader: undefined,
    targets: { ...DEFAULT_TARGETS, ...(inOptions.targets || {}) },
    classes: { ...DEFAULT_CLASSES, ...(inOptions.classes || {}) },
    clickEvents: inOptions.clickEvents,
    useTouchEvents: inOptions.useTouchEvents,
    ready: inOptions.ready,
    doneRendering: inOptions.doneRendering,
    events: inOptions.events || [],
    multiDayEvents: inOptions.multiDayEvents,
    adjacentDaysChangeMonth: inOptions.adjacentDaysChangeMonth || false,
    forceSixRows: inOptions.forceSixRows ?? null,
    selectedDate: inOptions.selectedDate ?? null,
    ignoreInactiveDaysInSelection:
      inOptions.ignoreInactiveDaysInSelection ?? null,
    lengthOfTime: inOptions.lengthOfTime,
    extras: inOptions.extras,
    constraints: inOptions.constraints ?? null,
    moment: inOptions.moment ?? null
  }

  const daysOfTheWeek = computeWeekdayLabels(adapter, o)

  return { options: o, daysOfTheWeek }
}
