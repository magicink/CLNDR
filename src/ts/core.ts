import type { AdapterDate, DateAdapter } from './date-adapter/adapter'
import { initState, type CalendarState } from './state'
import { baseTemplateData } from './templates'

type RuntimeEvent<T = unknown> = ClndrEvent & {
  _clndrStartDateObject: AdapterDate<T>
  _clndrEndDateObject: AdapterDate<T>
}

export interface ConstraintState {
  next: boolean
  previous: boolean
  nextYear: boolean
  previousYear: boolean
  today: boolean
}

export interface StateChange<T = unknown> {
  previous: CalendarState<T>
  current: CalendarState<T>
}

const ISO_FORMAT = 'YYYY-MM-DD'
const WEEK_LENGTH = 7
const SIX_ROWS = WEEK_LENGTH * 6

/**
 * Framework-agnostic CLNDR runtime implemented entirely in TypeScript.
 * This class encapsulates state transitions, event enrichment, constraint
 * validation, and template data construction. The DOM layer composes it to
 * provide the public API exposed by the facade and jQuery wrapper.
 */
export class ClndrCore<T = unknown> {
  private readonly adapter: DateAdapter<T>
  private options: ClndrOptions
  private state: CalendarState<T>

  private events: RuntimeEvent<T>[] = []
  private eventsThisInterval: RuntimeEvent<T>[] = []
  private eventsLastMonth: RuntimeEvent<T>[] = []
  private eventsNextMonth: RuntimeEvent<T>[] = []

  private constraintState: ConstraintState = {
    next: true,
    previous: true,
    nextYear: true,
    previousYear: true,
    today: true
  }

  private constraintStart: AdapterDate<T> | null = null
  private constraintEnd: AdapterDate<T> | null = null
  private currentIntervalStart: AdapterDate<T> | null = null

  constructor(adapter: DateAdapter<T>, options: ClndrOptions) {
    this.adapter = adapter
    this.options = ensureLengthDefaults(options)
    this.state = initState(adapter, this.options)
    this.bootstrapConstraints()
    this.setEvents(this.options.events || [])
  }

  getOptions(): ClndrOptions {
    return this.options
  }

  getState(): CalendarState<T> {
    return this.state
  }

  getConstraints(): ConstraintState {
    this.updateConstraintState()
    return this.constraintState
  }

  private usesDaysInterval(): boolean {
    return Boolean(this.options.lengthOfTime?.days)
  }

  private usesMonthsInterval(): boolean {
    return Boolean(this.options.lengthOfTime?.months)
  }

  setExtras(extras: any): void {
    this.options.extras = extras
  }

  setEvents(events: ClndrEvent[]): void {
    const processed = this.options.multiDayEvents
      ? this.addMultiDayDateObjects(events)
      : this.addDateObjects(events)
    this.events = processed
    this.options.events = processed
  }

  addEvents(events: ClndrEvent[]): void {
    const processed = this.options.multiDayEvents
      ? this.addMultiDayDateObjects(events)
      : this.addDateObjects(events)
    this.events = [...this.events, ...processed]
    this.options.events = this.events
  }

  removeEvents(match: (event: ClndrEvent) => boolean): void {
    this.events = this.events.filter(ev => !match(ev))
    this.options.events = this.events
  }

  setSelectedDate(value: string | AdapterDate<T> | null): void {
    if (!value) {
      this.options.selectedDate = null
      return
    }
    if (typeof value === 'string') {
      this.options.selectedDate = value
      return
    }
    this.options.selectedDate = value.format
      ? value.format(ISO_FORMAT)
      : value.toISO()
  }

  forward(step?: number): StateChange<T> | null {
    this.updateConstraintState()
    if (!this.constraintState.next) return null
    const interval = step ?? this.options.lengthOfTime?.interval ?? 1
    return this.updateState(prev => {
      if (this.usesDaysInterval()) {
        const start = prev.intervalStart.plus({ days: interval }).startOf('day')
        const span = (this.options.lengthOfTime?.days || 1) - 1
        const end = start.plus({ days: span }).endOf('day')
        return { ...prev, month: start, intervalStart: start, intervalEnd: end }
      }
      const start = prev.intervalStart
        .plus({ months: interval })
        .startOf('month')
      const span = this.options.lengthOfTime?.months || interval
      const end = start.plus({ months: span }).minus({ days: 1 }).endOf('month')
      return { ...prev, month: start, intervalStart: start, intervalEnd: end }
    })
  }

  back(step?: number): StateChange<T> | null {
    this.updateConstraintState()
    if (!this.constraintState.previous) return null
    const interval = step ?? this.options.lengthOfTime?.interval ?? 1
    return this.updateState(prev => {
      if (this.usesDaysInterval()) {
        const start = prev.intervalStart
          .minus({ days: interval })
          .startOf('day')
        const span = (this.options.lengthOfTime?.days || 1) - 1
        const end = start.plus({ days: span }).endOf('day')
        return { ...prev, month: start, intervalStart: start, intervalEnd: end }
      }
      const start = prev.intervalStart
        .minus({ months: interval })
        .startOf('month')
      const span = this.options.lengthOfTime?.months || interval
      const end = start.plus({ months: span }).minus({ days: 1 }).endOf('month')
      return { ...prev, month: start, intervalStart: start, intervalEnd: end }
    })
  }

  nextYear(): StateChange<T> | null {
    this.updateConstraintState()
    if (!this.constraintState.nextYear) return null
    return this.updateState(prev => {
      const start = prev.intervalStart.plus({ years: 1 })
      const end = prev.intervalEnd.plus({ years: 1 })
      const month = prev.month.plus({ years: 1 })
      return { ...prev, month, intervalStart: start, intervalEnd: end }
    })
  }

  previousYear(): StateChange<T> | null {
    this.updateConstraintState()
    if (!this.constraintState.previousYear) return null
    return this.updateState(prev => {
      const start = prev.intervalStart.minus({ years: 1 })
      const end = prev.intervalEnd.minus({ years: 1 })
      const month = prev.month.minus({ years: 1 })
      return { ...prev, month, intervalStart: start, intervalEnd: end }
    })
  }

  today(): StateChange<T> {
    return this.updateState(prev => {
      const now = this.adapter.now()
      if (this.usesDaysInterval()) {
        const lot = this.options.lengthOfTime || {}
        let start: AdapterDate<T>
        if (lot.startDate) {
          const ref = this.parseDateInput(lot.startDate)
          const index = this.weekdayIndex(ref)
          const base = now.startOf('week')
          start = this.adapter.setWeekday(base, index)
        } else {
          const offset = this.options.weekOffset ?? 0
          const base = now.startOf('week')
          start = this.adapter.setWeekday(base, offset)
        }
        const span = (lot.days || 1) - 1
        const end = start.plus({ days: span }).endOf('day')
        return { ...prev, month: start, intervalStart: start, intervalEnd: end }
      }
      const start = now.startOf('month')
      const span =
        this.options.lengthOfTime?.months ||
        this.options.lengthOfTime?.interval ||
        1
      const end = start.plus({ months: span }).minus({ days: 1 }).endOf('month')
      return { ...prev, month: start, intervalStart: start, intervalEnd: end }
    })
  }

  setMonth(newMonth: number | string): StateChange<T> | null {
    if (this.usesDaysInterval() || this.usesMonthsInterval()) {
      console.warn(
        'CLNDR: setMonth is only supported for single-month calendars.'
      )
      return null
    }
    return this.updateState(prev => {
      const year = Number(prev.month.format('YYYY'))
      const target = this.resolveMonthDate(newMonth, year)
      const start = target.startOf('month')
      const end = start.endOf('month')
      return { ...prev, month: start, intervalStart: start, intervalEnd: end }
    })
  }

  setYear(newYear: number): StateChange<T> {
    return this.updateState(prev => {
      const monthIndex = Number(prev.month.format('M')) - 1
      const iso = `${newYear}-${padMonth(monthIndex + 1)}-01`
      const month = this.adapter.fromISO(iso).startOf('month')
      const end = month.endOf('month')
      return { ...prev, month, intervalStart: month, intervalEnd: end }
    })
  }

  setIntervalStart(newDate: any): StateChange<T> | null {
    if (
      !this.options.lengthOfTime?.days &&
      !this.options.lengthOfTime?.months
    ) {
      console.warn(
        'CLNDR: setIntervalStart is only available when using lengthOfTime.'
      )
      return null
    }
    const parsed = this.parseDateInput(newDate)
    return this.updateState(prev => {
      if (this.usesDaysInterval()) {
        const start = parsed.startOf('day')
        const span = (this.options.lengthOfTime?.days || 1) - 1
        const end = start.plus({ days: span }).endOf('day')
        return { ...prev, month: start, intervalStart: start, intervalEnd: end }
      }
      const start = parsed.startOf('month')
      const span =
        this.options.lengthOfTime?.months ||
        this.options.lengthOfTime?.interval ||
        1
      const end = start.plus({ months: span }).minus({ days: 1 }).endOf('month')
      return { ...prev, month: start, intervalStart: start, intervalEnd: end }
    })
  }

  buildTemplateData(): ClndrTemplateData {
    const base = baseTemplateData(this.adapter, this.options)
    const data: ClndrTemplateData = { ...base }

    if (this.usesDaysInterval()) {
      const days = this.createDaysObject(
        this.state.intervalStart,
        this.state.intervalEnd
      )
      data.days = days
      data.month = null
      data.year = null
      data.intervalStart = this.state.intervalStart.value()
      data.intervalEnd = this.state.intervalEnd.value()
      data.numberOfRows = Math.ceil(days.length / WEEK_LENGTH)
      data.eventsThisInterval = this.eventsThisInterval
      data.eventsLastMonth = []
      data.eventsNextMonth = []
    } else if (this.usesMonthsInterval()) {
      const months: ClndrTemplateMonthBlock[] = []
      const intervalEvents: RuntimeEvent<T>[][] = []
      let rows = 0
      const count = this.options.lengthOfTime?.months || 0
      for (let i = 0; i < count; i++) {
        const start = this.state.intervalStart
          .plus({ months: i })
          .startOf('month')
        const end = start.endOf('month')
        const days = this.createDaysObject(start, end)
        months.push({ days, month: start.value() as any })
        intervalEvents.push([...this.eventsThisInterval])
        rows += Math.ceil(days.length / WEEK_LENGTH)
      }
      data.days = []
      data.months = months
      data.numberOfRows = rows
      data.eventsThisInterval = intervalEvents
      data.intervalStart = this.state.intervalStart.value()
      data.intervalEnd = this.state.intervalEnd.value()
    } else {
      const monthStart = this.state.month.startOf('month')
      const monthEnd = monthStart.endOf('month')
      const days = this.createDaysObject(monthStart, monthEnd)
      data.days = days
      data.month = this.state.month.format
        ? this.state.month.format('MMMM')
        : ''
      data.year = this.state.month.format ? this.state.month.format('YYYY') : ''
      data.eventsThisMonth = this.eventsThisInterval
      data.numberOfRows = Math.ceil(days.length / WEEK_LENGTH)
      data.eventsLastMonth = this.eventsLastMonth
      data.eventsNextMonth = this.eventsNextMonth
    }

    return data
  }

  private updateState(
    mutator: (prev: CalendarState<T>) => CalendarState<T>
  ): StateChange<T> {
    const previous = { ...this.state }
    this.state = mutator(this.state)
    this.updateConstraintState()
    return { previous, current: this.state }
  }

  private parseDateInput(value: any): AdapterDate<T> {
    if (!value) return this.adapter.now()
    if (typeof value === 'string') return this.adapter.fromISO(value)
    if (typeof value === 'number') {
      return this.adapter.fromNative(new Date(value) as any)
    }
    if (typeof value === 'object') {
      if (value.value && typeof value.value === 'function') {
        return this.adapter.fromNative(value.value())
      }
      if (typeof value.toISOString === 'function') {
        return this.adapter.fromISO(value.toISOString())
      }
    }
    return this.adapter.fromNative(value as T)
  }

  private addDateObjects(events: ClndrEvent[]): RuntimeEvent<T>[] {
    const key = this.options.dateParameter || 'date'
    return events.map(ev => {
      const start = this.parseDateInput((ev as any)[key])
      const runtime = ev as RuntimeEvent<T>
      runtime._clndrStartDateObject = start
      runtime._clndrEndDateObject = start
      return runtime
    })
  }

  private addMultiDayDateObjects(events: ClndrEvent[]): RuntimeEvent<T>[] {
    const config = this.options.multiDayEvents!
    return events.map(ev => {
      const runtime = ev as RuntimeEvent<T>
      const startRaw =
        (ev as any)[config.startDate] ??
        (config.singleDay ? (ev as any)[config.singleDay] : null)
      const endRaw =
        (ev as any)[config.endDate] ??
        (config.singleDay ? (ev as any)[config.singleDay] : null)
      const start = this.parseDateInput(startRaw || endRaw)
      const end = this.parseDateInput(endRaw || startRaw)
      runtime._clndrStartDateObject = start
      runtime._clndrEndDateObject = end
      return runtime
    })
  }

  private eventsInRange(
    events: RuntimeEvent<T>[],
    start: AdapterDate<T>,
    end: AdapterDate<T>
  ): RuntimeEvent<T>[] {
    const startDay = start.startOf('day')
    const endDay = end.endOf('day')
    return events.filter(ev => {
      const beforeStart = ev._clndrEndDateObject.isBefore(startDay)
      const afterEnd = ev._clndrStartDateObject.isAfter(endDay)
      return !(beforeStart || afterEnd)
    })
  }

  private createDaysObject(
    startDate: AdapterDate<T>,
    endDate: AdapterDate<T>
  ): ClndrDay[] {
    const days: ClndrDay[] = []
    const start = startDate.startOf('day')
    const end = endDate.endOf('day')
    this.currentIntervalStart = start
    this.eventsThisInterval = this.eventsInRange(this.events, start, end)

    if (!this.usesDaysInterval() && this.options.showAdjacentMonths) {
      const base = start.startOf('month')
      const lastMonthStart = base.minus({ months: 1 })
      const lastMonthEnd = lastMonthStart.endOf('month')
      const nextMonthStart = base.plus({ months: 1 })
      const nextMonthEnd = nextMonthStart.endOf('month')
      this.eventsLastMonth = this.eventsInRange(
        this.events,
        lastMonthStart,
        lastMonthEnd
      )
      this.eventsNextMonth = this.eventsInRange(
        this.events,
        nextMonthStart,
        nextMonthEnd
      )
    } else {
      this.eventsLastMonth = []
      this.eventsNextMonth = []
    }

    if (!this.usesDaysInterval()) {
      const offset = this.options.weekOffset ?? 0
      let diff = this.weekdayIndex(start) - offset
      if (diff < 0) diff += WEEK_LENGTH
      if (this.options.showAdjacentMonths) {
        for (let i = diff; i > 0; i--) {
          const filler = start.minus({ days: i })
          days.push(this.createDayObject(filler, this.eventsLastMonth))
        }
      } else {
        for (let i = 0; i < diff; i++) {
          days.push(
            this.calendarDay({
              classes:
                `${this.targetsEmpty()} ${this.options.classes?.lastMonth || ''}`.trim()
            })
          )
        }
      }
    }

    let cursor = start
    while (!cursor.isAfter(end)) {
      days.push(this.createDayObject(cursor, this.eventsThisInterval))
      cursor = cursor.plus({ days: 1 })
    }

    if (!this.usesDaysInterval()) {
      while (days.length % WEEK_LENGTH !== 0) {
        if (this.options.showAdjacentMonths) {
          days.push(this.createDayObject(cursor, this.eventsNextMonth))
        } else {
          days.push(
            this.calendarDay({
              classes:
                `${this.targetsEmpty()} ${this.options.classes?.nextMonth || ''}`.trim()
            })
          )
        }
        cursor = cursor.plus({ days: 1 })
      }
    }

    if (this.options.forceSixRows && days.length < SIX_ROWS) {
      while (days.length < SIX_ROWS) {
        if (this.options.showAdjacentMonths) {
          days.push(this.createDayObject(cursor, this.eventsNextMonth))
        } else {
          days.push(
            this.calendarDay({
              classes:
                `${this.targetsEmpty()} ${this.options.classes?.nextMonth || ''}`.trim()
            })
          )
        }
        cursor = cursor.plus({ days: 1 })
      }
    }

    return days
  }

  private createDayObject(
    day: AdapterDate<T>,
    monthEvents: RuntimeEvent<T>[]
  ): ClndrDay {
    const dayStart = day.startOf('day')
    const dayEnd = day.endOf('day')
    const eventsToday = monthEvents.filter(ev => {
      const beforeStart = ev._clndrEndDateObject.isBefore(dayStart)
      const afterEnd = ev._clndrStartDateObject.isAfter(dayEnd)
      return !(beforeStart || afterEnd)
    })

    const classes: string[] = [this.targetsDay()]
    const properties: ClndrDay['properties'] = {
      isToday: false,
      isInactive: false,
      isAdjacentMonth: false
    }

    const now = this.adapter.now()
    if (day.hasSame(now, 'day')) {
      classes.push(this.options.classes?.today || 'today')
      properties.isToday = true
    }

    const nowStart = now.startOf('day')
    if (dayEnd.isBefore(nowStart)) {
      classes.push(this.options.classes?.past || 'past')
    }

    if (eventsToday.length) {
      classes.push(this.options.classes?.event || 'event')
    }

    if (!this.usesDaysInterval() && this.currentIntervalStart) {
      const monthStart = this.currentIntervalStart.startOf('month')
      const monthEnd = monthStart.endOf('month')
      if (day.isBefore(monthStart)) {
        classes.push(this.options.classes?.adjacentMonth || 'adjacent-month')
        classes.push(this.options.classes?.lastMonth || 'last-month')
        properties.isAdjacentMonth = true
      } else if (day.isAfter(monthEnd)) {
        classes.push(this.options.classes?.adjacentMonth || 'adjacent-month')
        classes.push(this.options.classes?.nextMonth || 'next-month')
        properties.isAdjacentMonth = true
      }
    }

    if (this.constraintStart && day.isBefore(this.constraintStart)) {
      classes.push(this.options.classes?.inactive || 'inactive')
      properties.isInactive = true
    }
    if (this.constraintEnd && day.isAfter(this.constraintEnd)) {
      classes.push(this.options.classes?.inactive || 'inactive')
      properties.isInactive = true
    }

    if (this.options.selectedDate) {
      const selected = this.parseDateInput(this.options.selectedDate)
      if (day.hasSame(selected, 'day')) {
        classes.push(this.options.classes?.selected || 'selected')
      }
    }

    classes.push(`calendar-day-${day.format(ISO_FORMAT)}`)
    classes.push(`calendar-dow-${this.weekdayIndex(day)}`)

    return this.calendarDay({
      date: day.value(),
      day: day.day(),
      events: eventsToday,
      properties,
      classes: classes.join(' ').trim()
    })
  }

  private calendarDay(partial: Partial<ClndrDay>): ClndrDay {
    return {
      day: partial.day ?? 0,
      date: partial.date ?? null,
      events: partial.events ?? [],
      classes: partial.classes ?? this.targetsEmpty(),
      properties: partial.properties
    }
  }

  private targetsDay(): string {
    return this.options.targets?.day || 'day'
  }

  private targetsEmpty(): string {
    return this.options.targets?.empty || 'empty'
  }

  private weekdayIndex(date: AdapterDate<T>): number {
    const isoZero = date.weekday() % WEEK_LENGTH
    const localeStart = this.adapter.firstDayOfWeek()
    let relative = isoZero - localeStart
    if (relative < 0) relative += WEEK_LENGTH
    return relative
  }

  private bootstrapConstraints(): void {
    if (!this.options.constraints) return
    if (this.options.constraints.startDate) {
      this.constraintStart = this.parseDateInput(
        this.options.constraints.startDate
      ).startOf('day')
    }
    if (this.options.constraints.endDate) {
      this.constraintEnd = this.parseDateInput(
        this.options.constraints.endDate
      ).endOf('day')
    }
    this.updateConstraintState()
  }

  private updateConstraintState(): void {
    const state: ConstraintState = {
      next: true,
      previous: true,
      nextYear: true,
      previousYear: true,
      today: true
    }

    if (!this.constraintStart && !this.constraintEnd) {
      this.constraintState = state
      return
    }

    const start = this.constraintStart
    const end = this.constraintEnd
    const oneYearAgo = this.state.intervalStart.minus({ years: 1 })
    const oneYearFromEnd = this.state.intervalEnd.plus({ years: 1 })

    if (start) {
      const disablePrev =
        start.isAfter(this.state.intervalStart) ||
        (this.usesDaysInterval()
          ? start.hasSame(this.state.intervalStart, 'day')
          : start.hasSame(this.state.intervalStart, 'month'))
      if (disablePrev) state.previous = false
      if (start.isAfter(oneYearAgo)) state.previousYear = false
    }

    if (end) {
      const disableNext =
        end.isBefore(this.state.intervalEnd) ||
        (this.usesDaysInterval()
          ? end.hasSame(this.state.intervalEnd, 'day')
          : end.hasSame(this.state.intervalEnd, 'month'))
      if (disableNext) state.next = false
      if (end.isBefore(oneYearFromEnd)) state.nextYear = false
    }

    const now = this.adapter.now().startOf('month')
    if ((start && start.isAfter(now)) || (end && end.isBefore(now))) {
      state.today = false
    }

    this.constraintState = state
  }

  private resolveMonthDate(
    input: number | string,
    year: number
  ): AdapterDate<T> {
    if (typeof input === 'number') {
      const iso = `${year}-${padMonth(input + 1)}-01`
      return this.adapter.fromISO(iso)
    }

    const tokens = ['MMMM YYYY', 'MMM YYYY']
    for (const fmt of tokens) {
      try {
        return this.adapter.fromFormat(`${input} ${year}`, fmt)
      } catch {
        // continue
      }
    }
    return this.adapter.fromISO(`${year}-01-01`)
  }
}

function ensureLengthDefaults(options: ClndrOptions): ClndrOptions {
  if (!options.lengthOfTime) {
    options.lengthOfTime = { days: null, months: null, interval: 1 }
  } else if (options.lengthOfTime.interval == null) {
    options.lengthOfTime.interval = 1
  }
  return options
}

function padMonth(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}
