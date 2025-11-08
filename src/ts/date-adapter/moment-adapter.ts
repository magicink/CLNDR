/**
 * Moment-based DateAdapter implementation.
 * Provides a compatibility layer that mirrors the legacy Moment usage in
 * CLNDR, enabling the core to speak via a stable adapter interface.
 */
import momentLib from 'moment'
import {
  AdapterDate,
  DateAdapter,
  DateUnit,
  DurationLike,
  WeekdayLabelStyle
} from './adapter'

/** Underlying Moment instance type used by this adapter. */
type Moment = ReturnType<typeof momentLib>

/** AdapterDate wrapper around a Moment instance. */
class MomentAdapterDate implements AdapterDate<Moment> {
  constructor(private m: Moment) {}

  /** Return the wrapped Moment instance. */
  value(): Moment {
    return this.m
  }

  /** Serialize to ISO string using Moment's toISOString(). */
  toISO(): string {
    return this.m.toISOString()
  }

  /** Format using Moment token syntax. */
  format(fmt: string): string {
    return this.m.format(fmt)
  }

  /** Non-mutating startOf boundary. */
  startOf(unit: DateUnit): AdapterDate<Moment> {
    return new MomentAdapterDate(this.m.clone().startOf(unit as any))
  }

  /** Non-mutating endOf boundary. */
  endOf(unit: DateUnit): AdapterDate<Moment> {
    return new MomentAdapterDate(this.m.clone().endOf(unit as any))
  }

  /** Add a duration (non-mutating). */
  plus(delta: DurationLike): AdapterDate<Moment> {
    const m = this.m.clone()
    if (delta.milliseconds) m.add(delta.milliseconds, 'milliseconds')
    if (delta.seconds) m.add(delta.seconds, 'seconds')
    if (delta.minutes) m.add(delta.minutes, 'minutes')
    if (delta.hours) m.add(delta.hours, 'hours')
    if (delta.days) m.add(delta.days, 'days')
    if (delta.weeks) m.add(delta.weeks, 'weeks')
    if (delta.months) m.add(delta.months, 'months')
    if (delta.years) m.add(delta.years, 'years')
    return new MomentAdapterDate(m)
  }

  /** Subtract a duration (non-mutating). */
  minus(delta: DurationLike): AdapterDate<Moment> {
    const m = this.m.clone()
    if (delta.milliseconds) m.subtract(delta.milliseconds, 'milliseconds')
    if (delta.seconds) m.subtract(delta.seconds, 'seconds')
    if (delta.minutes) m.subtract(delta.minutes, 'minutes')
    if (delta.hours) m.subtract(delta.hours, 'hours')
    if (delta.days) m.subtract(delta.days, 'days')
    if (delta.weeks) m.subtract(delta.weeks, 'weeks')
    if (delta.months) m.subtract(delta.months, 'months')
    if (delta.years) m.subtract(delta.years, 'years')
    return new MomentAdapterDate(m)
  }

  /** ISO weekday 1..7 (Mon=1, Sun=7). */
  weekday(): number {
    // ISO weekday 1..7 (Mon=1)
    return this.m.isoWeekday()
  }

  day(): number {
    return this.m.date()
  }

  daysInMonth(): number {
    return this.m.daysInMonth()
  }

  isBefore(other: AdapterDate<Moment>): boolean {
    return this.m.isBefore((other as MomentAdapterDate).value())
  }

  isAfter(other: AdapterDate<Moment>): boolean {
    return this.m.isAfter((other as MomentAdapterDate).value())
  }

  hasSame(other: AdapterDate<Moment>, unit: DateUnit): boolean {
    return this.m.isSame((other as MomentAdapterDate).value(), unit as any)
  }
}

/** DateAdapter implementation targeting Moment.js. */
export class MomentDateAdapter implements DateAdapter<Moment> {
  constructor(private locale: string = momentLib.locale()) {}

  now(): AdapterDate<Moment> {
    return new MomentAdapterDate(momentLib())
  }

  fromISO(iso: string): AdapterDate<Moment> {
    return new MomentAdapterDate(momentLib(iso))
  }

  fromFormat(text: string, fmt: string): AdapterDate<Moment> {
    return new MomentAdapterDate(momentLib(text, fmt))
  }

  fromNative(value: Moment): AdapterDate<Moment> {
    return new MomentAdapterDate(momentLib(value))
  }

  withLocale(locale: string): DateAdapter<Moment> {
    return new MomentDateAdapter(locale)
  }

  getLocale(): string {
    return this.locale
  }

  /** Locale-based first day-of-week: 0..6 (0=Sunday). */
  firstDayOfWeek(): number {
    // 0..6, Sunday=0
    return momentLib.localeData(this.locale).firstDayOfWeek()
  }

  /**
   * Set weekday by locale-relative index (0 is locale first day-of-week)
   * within the week of the provided base date.
   */
  setWeekday(date: AdapterDate<Moment>, index: number): AdapterDate<Moment> {
    // index is 0..6 relative to locale firstDayOfWeek().
    // Use locale-aware weekday() to stay within the same locale week
    // of the provided base date.
    // In moment, weekday(0) is the locale first day-of-week.
    const targetDow = (((index % 7) + 7) % 7) as number
    const m = (date as MomentAdapterDate).value().clone().weekday(targetDow)
    return new MomentAdapterDate(m)
  }

  /** Localized weekday labels from moment's locale data. */
  weekdayLabels(style: WeekdayLabelStyle): string[] {
    const ld = momentLib.localeData(this.locale)
    if (style === 'narrow') return ld.weekdaysMin()
    if (style === 'short') return ld.weekdaysShort()
    return ld.weekdays()
  }

  /** No-op for Moment; legacy tokens already match. */
  normalizeTokens(fmt: string): string {
    // Moment already uses legacy tokens used by CLNDR, no change needed
    return fmt
  }
}

/** Factory for a MomentDateAdapter bound to an optional locale. */
export function createMomentAdapter(locale?: string): DateAdapter<Moment> {
  return new MomentDateAdapter(locale)
}
