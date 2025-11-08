// Minimal Luxon typings used by our adapters/tests
// This shim is present because ts-jest with moduleResolution "Bundler"
// can fail to resolve Luxon's bundled types via package exports.

declare module 'luxon' {
  export type ToFormatOptions = { locale?: string } & Record<string, any>

  export class DateTime {
    // Static constructors
    static now(): DateTime
    static fromISO(
      text: string,
      opts?: { locale?: string; zone?: string }
    ): DateTime
    static fromFormat(
      text: string,
      fmt: string,
      opts?: { locale?: string; zone?: string }
    ): DateTime
    static fromJSDate(
      date: Date,
      opts?: { locale?: string; zone?: string }
    ): DateTime
    static isDateTime(v: any): v is DateTime

    // Instance chaining
    set(values: Record<string, number>): DateTime
    setLocale(locale: string): DateTime
    setZone(zone: string): DateTime
    toFormat(fmt: string, opts?: ToFormatOptions): string
    toISO(): string | null
    toISODate(): string | null
    startOf(unit: string): DateTime
    endOf(unit: string): DateTime
    plus(
      values: Partial<{
        milliseconds: number
        seconds: number
        minutes: number
        hours: number
        days: number
        weeks: number
        months: number
        years: number
      }>
    ): DateTime
    minus(
      values: Partial<{
        milliseconds: number
        seconds: number
        minutes: number
        hours: number
        days: number
        weeks: number
        months: number
        years: number
      }>
    ): DateTime
    toMillis(): number
    hasSame(other: DateTime, unit: string): boolean

    // Fields
    readonly weekday: number // 1..7 (Mon..Sun)
    readonly day: number // day of month
    readonly daysInMonth: number
  }

  export class Info {
    static weekdays(
      style: 'narrow' | 'short' | 'long',
      opts?: { locale?: string }
    ): string[]
  }
}
