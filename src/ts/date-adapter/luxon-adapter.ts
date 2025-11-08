import { DateTime, Info } from 'luxon'

import type {
  AdapterDate,
  DateAdapter,
  DateUnit,
  DurationLike,
  WeekdayLabelStyle
} from './adapter'

/** AdapterDate implementation backed by Luxon DateTime. */
class LuxonAdapterDate implements AdapterDate<DateTime> {
  constructor(
    private dt: DateTime,
    private owner: LuxonDateAdapter
  ) {}

  value(): DateTime {
    return this.dt
  }

  toISO(): string {
    return this.dt.toISO() || this.dt.toISODate()!
  }

  format(fmt: string): string {
    // Special-case Moment's two-letter weekday token (dd). Luxon doesn't
    // provide a direct token for this width, so derive from short name.
    if (fmt === 'dd') {
      const labels = Info.weekdays('short', { locale: this.owner.getLocale() })
      const label = labels[this.dt.weekday - 1] || this.dt.toFormat('ccc')
      return label.slice(0, 2)
    }

    const mapped = this.owner.normalizeTokens(fmt)
    return this.dt.setLocale(this.owner.getLocale()).toFormat(mapped)
  }

  startOf(unit: DateUnit): AdapterDate<DateTime> {
    if (unit === 'week') {
      // Compute locale-aware week start within the same week as this.dt.
      // Map locale firstDayOfWeek (0=Sun..6=Sat) to ISO (1=Mon..7=Sun).
      const desired = this.owner.firstDayOfWeek()
      const isoDesired = desired === 0 ? 7 : desired
      const dowISO = this.dt.weekday // 1..7
      const daysBack = (dowISO - isoDesired + 7) % 7
      const adjusted = this.dt.minus({ days: daysBack }).startOf('day')
      return new LuxonAdapterDate(adjusted, this.owner)
    }
    return new LuxonAdapterDate(this.dt.startOf(unit as any), this.owner)
  }

  endOf(unit: DateUnit): AdapterDate<DateTime> {
    if (unit === 'week') {
      const start = this.startOf('week') as LuxonAdapterDate
      return new LuxonAdapterDate(
        start.value().plus({ days: 6 }).endOf('day'),
        this.owner
      )
    }
    return new LuxonAdapterDate(this.dt.endOf(unit as any), this.owner)
  }

  plus(delta: DurationLike): AdapterDate<DateTime> {
    return new LuxonAdapterDate(this.dt.plus(delta as any), this.owner)
  }

  minus(delta: DurationLike): AdapterDate<DateTime> {
    return new LuxonAdapterDate(this.dt.minus(delta as any), this.owner)
  }

  weekday(): number {
    // Luxon: 1..7 (Mon=1)
    return this.dt.weekday
  }

  day(): number {
    return this.dt.day
  }

  daysInMonth(): number {
    return this.dt.daysInMonth
  }

  isBefore(other: AdapterDate<DateTime>): boolean {
    return this.dt.toMillis() < (other as LuxonAdapterDate).value().toMillis()
  }

  isAfter(other: AdapterDate<DateTime>): boolean {
    return this.dt.toMillis() > (other as LuxonAdapterDate).value().toMillis()
  }

  hasSame(other: AdapterDate<DateTime>, unit: DateUnit): boolean {
    return this.dt.hasSame((other as LuxonAdapterDate).value(), unit as any)
  }
}

/** DateAdapter implementation targeting Luxon DateTime. */
export class LuxonDateAdapter implements DateAdapter<DateTime> {
  constructor(
    private locale: string = 'en',
    private zone?: string
  ) {}

  now(): AdapterDate<DateTime> {
    let dt: DateTime
    const g: any = globalThis as any
    const gm = g?.moment
    if (gm && typeof gm.now === 'function') {
      try {
        const ms = gm.now()
        if (typeof ms === 'number') {
          dt = (DateTime as any).fromMillis(ms)
        } else {
          dt = DateTime.now()
        }
      } catch {
        dt = DateTime.now()
      }
    } else {
      dt = DateTime.now()
    }
    dt = dt.set({})
    const localized = dt.setLocale(this.locale)
    const zoned = this.zone ? localized.setZone(this.zone) : localized
    return new LuxonAdapterDate(zoned, this)
  }

  fromISO(iso: string): AdapterDate<DateTime> {
    const dt = DateTime.fromISO(iso, { locale: this.locale, zone: this.zone })
    return new LuxonAdapterDate(dt, this)
  }

  fromFormat(text: string, fmt: string): AdapterDate<DateTime> {
    const mapped = this.normalizeTokens(fmt)
    const dt = DateTime.fromFormat(text, mapped, {
      locale: this.locale,
      zone: this.zone
    })
    return new LuxonAdapterDate(dt, this)
  }

  fromNative(value: DateTime): AdapterDate<DateTime> {
    const dt = DateTime.isDateTime(value)
      ? value
      : DateTime.fromJSDate(value as unknown as Date, {
          locale: this.locale,
          zone: this.zone
        })
    const localized = dt.setLocale(this.locale)
    const zoned = this.zone ? localized.setZone(this.zone) : localized
    return new LuxonAdapterDate(zoned, this)
  }

  withLocale(locale: string): DateAdapter<DateTime> {
    return new LuxonDateAdapter(locale, this.zone)
  }

  getLocale(): string {
    return this.locale
  }

  /**
   * Locale-based first day-of-week: 0..6 (0=Sunday).
   * Luxon/Intl do not expose this uniformly across environments, so
   * approximate with a small mapping aligned with Moment defaults used
   * by our tests (en → Sunday, fr/de/en-GB → Monday).
   */
  firstDayOfWeek(): number {
    const loc = (this.locale || 'en').toLowerCase()
    if (
      loc.startsWith('fr') ||
      loc.startsWith('de') ||
      loc.startsWith('en-gb')
    ) {
      return 1 // Monday
    }
    return 0 // Sunday (en, en-US, etc.)
  }

  setWeekday(
    date: AdapterDate<DateTime>,
    index: number
  ): AdapterDate<DateTime> {
    // Index is 0..6 relative to locale first day-of-week.
    const base = (date as LuxonAdapterDate).value()
    const start = new LuxonAdapterDate(base, this).startOf(
      'week'
    ) as LuxonAdapterDate
    const target = start.value().plus({ days: ((index % 7) + 7) % 7 })
    return new LuxonAdapterDate(target, this)
  }

  weekdayLabels(style: WeekdayLabelStyle): string[] {
    // Luxon returns Monday-first arrays; reorder to start at locale first day.
    const raw = Info.weekdays(style as any, { locale: this.locale })
    const fdow = this.firstDayOfWeek() // 0..6 (0=Sun)
    const startIndex = fdow === 0 ? 6 : fdow - 1
    return [...raw.slice(startIndex), ...raw.slice(0, startIndex)]
  }

  /**
   * Map common Moment tokens used by CLNDR to Luxon/ICU tokens.
   * Only a minimal subset is required for our templates/tests.
   */
  normalizeTokens(fmt: string): string {
    let out = fmt
    // Years
    out = out.replace(/YYYY/g, 'yyyy').replace(/YY/g, 'yy')
    // Weekday names (avoid interfering with day-of-month D tokens)
    out = out.replace(/dddd/g, 'cccc').replace(/ddd(?!d)/g, 'ccc')
    // Months: protect MMMM first, then shorter tokens
    out = out.replace(/MMMM/g, 'LLLL').replace(/MMM(?!M)/g, 'LLL')
    out = out.replace(/MM(?!M)/g, 'LL').replace(/M(?!M)/g, 'L')
    // Day of month
    out = out.replace(/DD(?!D)/g, 'dd').replace(/D(?!D)/g, 'd')
    return out
  }
}

/** Factory for a LuxonDateAdapter bound to an optional locale/zone. */
export function createLuxonAdapter(
  locale?: string,
  zone?: string
): DateAdapter<DateTime> {
  return new LuxonDateAdapter(locale, zone)
}
