import { AdapterDate, DateAdapter } from './date-adapter/adapter'

/**
 * Immutable snapshot of calendar timing state derived from configuration.
 *
 * @template TNative Underlying date value type for the active adapter
 * @property month The anchor month for the current view (start of month)
 * @property intervalStart Inclusive start of the visible range
 * @property intervalEnd Inclusive end of the visible range (endOf('day'))
 * @property selectedDate Currently selected date, if any
 */
export interface CalendarState<TNative = unknown> {
  month: AdapterDate<TNative>
  intervalStart: AdapterDate<TNative>
  intervalEnd: AdapterDate<TNative>
  selectedDate: AdapterDate<TNative> | null
}

/**
 * Coerce a mixed input value (ISO string or native value) into an adapter date.
 *
 * - `null`/`undefined` → `adapter.now()`
 * - `string` → `adapter.fromISO(string)`
 * - otherwise → `adapter.fromNative(value)`
 *
 * @internal Utility used by state initialization
 */
function parseToAdapterDate<T>(
  adapter: DateAdapter<T>,
  v: any
): AdapterDate<T> {
  if (v == null) return adapter.now()
  if (typeof v === 'string') return adapter.fromISO(v)
  return adapter.fromNative(v as any)
}

/**
 * Initialize calendar timing state from options using the provided DateAdapter.
 *
 * Semantics (parity with legacy CLNDR):
 * - Default view: single month anchored to `now()`, so
 *   `month = now().startOf('month')`, `intervalStart = month`,
 *   `intervalEnd = month.endOf('month')`.
 * - Months mode (`lengthOfTime.months`):
 *   - Anchor from `lengthOfTime.startDate`, else `startWithMonth`, else `now()`;
 *     take `.startOf('month')`.
 *   - Interval is inclusive: `start` through
 *     `start.plus({ months }).minus({ days: 1 }).endOf('day')`.
 * - Days mode (`lengthOfTime.days`):
 *   - Anchor from `lengthOfTime.startDate`, else `now()`; take `.startOf('day')`.
 *   - Align `intervalStart` to the requested weekday index according to
 *     `weekOffset` (0..6) within the same week as the anchor using
 *     `adapter.setWeekday(startOf('week'), weekOffset)`.
 *   - Interval is `days - 1` days after `intervalStart`, inclusive of end day.
 * - `startWithMonth` overrides the anchor month for any mode and recomputes
 *   `intervalEnd` based on `lengthOfTime` (days/months) or the end of that month.
 * - `selectedDate` is parsed when provided, else `null`.
 *
 * @template T Underlying adapter native type
 * @param adapter Active date adapter
 * @param options CLNDR options used to compute initial state
 * @returns Derived {@link CalendarState}
 */
export function initState<T>(
  adapter: DateAdapter<T>,
  options: ClndrOptions
): CalendarState<T> {
  const lot = options.lengthOfTime || {}
  let month: AdapterDate<T>
  let intervalStart: AdapterDate<T>
  let intervalEnd: AdapterDate<T>

  if (lot.months || lot.days) {
    if (lot.months) {
      // Months mode
      const startMonth = (
        lot.startDate
          ? parseToAdapterDate(adapter, lot.startDate)
          : options.startWithMonth
            ? parseToAdapterDate(adapter, options.startWithMonth)
            : adapter.now()
      ).startOf('month')

      intervalStart = startMonth
      intervalEnd = startMonth
        .plus({ months: lot.months as number })
        .minus({ days: 1 })
        .endOf('day')
      month = startMonth
    } else {
      // Days mode
      const startDay = (
        lot.startDate
          ? parseToAdapterDate(adapter, lot.startDate)
          : adapter.now()
      ).startOf('day')

      // Align to the requested weekday within this week.
      const base = startDay.startOf('week')
      const weekOffset = options.weekOffset ?? 0
      intervalStart = adapter.setWeekday(base, weekOffset)
      intervalEnd = intervalStart
        .plus({ days: (lot.days as number) - 1 })
        .endOf('day')
      month = intervalStart
    }
  } else {
    // Default: single month view
    month = adapter.now().startOf('month')
    intervalStart = month
    intervalEnd = month.endOf('month')
  }

  if (options.startWithMonth) {
    month = parseToAdapterDate(adapter, options.startWithMonth).startOf('month')
    intervalStart = month
    const hasDays = !!options.lengthOfTime?.days
    const hasMonths = !!options.lengthOfTime?.months
    if (hasDays) {
      intervalEnd = month
        .plus({ days: (options.lengthOfTime!.days as number) - 1 })
        .endOf('day')
    } else if (hasMonths) {
      intervalEnd = month
        .plus({ months: options.lengthOfTime!.months as number })
        .minus({ days: 1 })
        .endOf('day')
    } else {
      intervalEnd = month.endOf('month')
    }
  }

  const selectedDate = options.selectedDate
    ? parseToAdapterDate(adapter, options.selectedDate)
    : null

  return { month, intervalStart, intervalEnd, selectedDate }
}
