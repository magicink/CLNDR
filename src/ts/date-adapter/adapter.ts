/**
 * DateAdapter interface and supporting types used by CLNDR core.
 *
 * The adapter provides a thin abstraction over a date library
 * (Moment/Luxon/etc.) so core code never depends on a specific runtime.
 *
 * Implementations MUST preserve legacy Moment semantics when used with
 * existing templates and options. All date math in core should be expressed
 * via this surface, never by calling the date library directly.
 */

/**
 * Display width for localized weekday labels.
 * - 'narrow' → typically 1–2 chars (e.g., Su)
 * - 'short' → abbreviated (e.g., Sun)
 * - 'long' → full name (e.g., Sunday)
 */
export type WeekdayLabelStyle = 'narrow' | 'short' | 'long'

/**
 * Supported units for start/end boundaries and comparisons.
 */
export type DateUnit =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year'

/**
 * Duration-like payload for plus/minus operations.
 */
export type DurationLike = Partial<{
  milliseconds: number
  seconds: number
  minutes: number
  hours: number
  days: number
  weeks: number
  months: number
  years: number
}>

/**
 * Wrapper around the adapter's date value that exposes common operations.
 */
export interface AdapterDate<TNative = unknown> {
  /**
   * Return the underlying library date instance, useful for advanced
   * consumer formatting or interop with legacy callbacks.
   */
  value(): TNative

  /**
   * Format this date using the adapter’s token set. Adapters implementing
   * token normalization should map legacy tokens accordingly.
   */
  toISO(): string
  format(fmt: string): string

  /**
   * Non-mutating arithmetic and boundary helpers. All methods return a
   * new AdapterDate value and MUST NOT mutate the receiver.
   */
  startOf(unit: DateUnit): AdapterDate<TNative>
  endOf(unit: DateUnit): AdapterDate<TNative>
  plus(delta: DurationLike): AdapterDate<TNative>
  minus(delta: DurationLike): AdapterDate<TNative>

  /**
   * Field accessors.
   * - weekday(): ISO 1..7 (Mon=1, Sun=7)
   * - day(): 1..31 day-of-month
   * - daysInMonth(): count for current month
   */
  weekday(): number
  day(): number
  daysInMonth(): number

  /** Comparisons against another AdapterDate */
  isBefore(other: AdapterDate<TNative>): boolean
  isAfter(other: AdapterDate<TNative>): boolean
  hasSame(other: AdapterDate<TNative>, unit: DateUnit): boolean
}

export interface DateAdapter<TNative = unknown> {
  /** Current moment (adapter-native ‘now’) */
  now(): AdapterDate<TNative>

  /** Parsing helpers producing adapter dates. */
  fromISO(iso: string): AdapterDate<TNative>
  fromFormat(text: string, fmt: string): AdapterDate<TNative>
  /** Parse a native library date value. */
  fromNative(value: TNative): AdapterDate<TNative>

  /**
   * Locale surface.
   * - withLocale: return a new adapter bound to the locale.
   * - getLocale: current locale identifier.
   * - firstDayOfWeek: 0..6 (0=Sunday) per locale.
   * - setWeekday: set day-of-week by index where 0 is the first day-of-week
   *   for this locale (i.e., locale-relative index within the same week).
   * - weekdayLabels: localized labels for header generation.
   */
  withLocale(locale: string): DateAdapter<TNative>
  getLocale(): string
  firstDayOfWeek(): number
  setWeekday(date: AdapterDate<TNative>, index: number): AdapterDate<TNative>
  weekdayLabels(style: WeekdayLabelStyle): string[]

  /**
   * Optional format token normalization used by adapters to map between
   * legacy Moment tokens and their runtime equivalents.
   */
  normalizeTokens(fmt: string): string
}

/**
 * Rotate an array by `by` steps to the left. Negative values rotate right.
 */
export function rotate<T>(arr: T[], by: number): T[] {
  const n = ((by % arr.length) + arr.length) % arr.length
  return [...arr.slice(n), ...arr.slice(0, n)]
}
