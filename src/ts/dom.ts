import $ from 'jquery'

import type { AdapterDate, DateAdapter } from './date-adapter/adapter'
import type { ClndrCore, ConstraintState, StateChange } from './core'
import type { TemplateRenderer } from './templates'

type RuntimeEvent = ClndrEvent & {
  _clndrStartDateObject?: any
  _clndrEndDateObject?: any
}

/**
 * DOM integration layer for CLNDR's TypeScript core.
 * Responsible for templated rendering, event delegation, and callback wiring.
 */
export class ClndrDOM<T = unknown> {
  public readonly element: JQuery

  private readonly core: ClndrCore<T>
  private readonly renderer: TemplateRenderer
  private readonly adapter: DateAdapter<T>
  private readonly container: JQuery
  private readonly options: ClndrOptions
  private readonly eventType: string
  private readonly eventName: string

  private apiContext: Clndr | null = null
  private headingId: string

  constructor(
    element: HTMLElement | JQuery | string,
    core: ClndrCore<T>,
    renderer: TemplateRenderer,
    adapter: DateAdapter<T>
  ) {
    this.core = core
    this.renderer = renderer
    this.adapter = adapter
    this.options = core.getOptions()
    this.element = this.resolveElement(element)
    this.assertSingleElement(this.element)
    this.element.html("<div class='clndr'></div>")
    this.container = this.element.find('.clndr')
    // Ensure the container has a valid landmark/widget role so aria-labelledby is meaningful
    if (!this.container.attr('role')) {
      this.container.attr('role', 'group')
    }
    // Optionally apply mode/theme classes for wrapper-free styling.
    if ((this.options as any).applyThemeClasses) {
      // Mode is derived from lengthOfTime (days => grid, months => months, else table).
      const lot = (this.options.lengthOfTime || {}) as any
      const mode: 'table' | 'grid' | 'months' = lot.days
        ? 'grid'
        : lot.months
          ? 'months'
          : 'table'
      const defaultTheme = mode === 'table' ? 'modern' : mode
      const theme = (this.options as any).theme || defaultTheme
      this.container
        .addClass(`clndr--mode-${mode}`)
        .addClass(`clndr--theme-${theme}`)
    }
    this.eventType = this.options.useTouchEvents ? 'touchstart' : 'click'
    this.eventName = `${this.eventType}.clndr`
    this.headingId = `clndr-heading-${Math.random().toString(36).slice(2)}`
    this.bindEvents()
  }

  attachApi(api: Clndr): void {
    this.apiContext = api
  }

  render(): void {
    const data = this.core.buildTemplateData()
    const html = this.renderer(data)
    this.container.html(html)
    // Attach aria-labelledby to container and ensure the month heading has an id.
    const heading = this.container.find('.month').first()
    if (heading && heading.length) {
      heading.attr('id', this.headingId)
      if (!heading.attr('aria-live')) heading.attr('aria-live', 'polite')
      this.container.attr('aria-labelledby', this.headingId)
    }
    // Reflect ARIA states for selected/disabled days
    this.applyAriaStates()
    this.applyConstraintClasses()
    if (typeof this.options.doneRendering === 'function') {
      this.options.doneRendering.apply(this.apiContext ?? this, [])
    }
  }

  applyChange(
    change: StateChange<T>,
    opts: { action?: 'today'; fireCallbacks?: boolean } = {}
  ): void {
    this.render()
    const fireCallbacks = opts.fireCallbacks !== false

    if (
      opts.action === 'today' &&
      fireCallbacks &&
      this.options.clickEvents?.today
    ) {
      this.options.clickEvents.today.apply(this.apiContext ?? this, [
        change.current.month.value()
      ])
    }
    if (fireCallbacks) {
      this.triggerEvents(change)
    }
  }

  destroy(): void {
    this.element.off('.clndr')
    this.container.remove()
  }

  private bindEvents(): void {
    const targets = this.options.targets!
    const eventName = this.eventName
    this.element.off('.clndr')

    this.element.on(eventName, `.${targets.day}`, event =>
      this.handleDayClick(event)
    )
    this.element.on(eventName, `.${targets.empty}`, event =>
      this.handleEmptyClick(event)
    )
    this.element.on(eventName, `.${targets.nextButton}`, event => {
      event.preventDefault()
      this.handleNavigation('forward')
    })
    this.element.on(eventName, `.${targets.previousButton}`, event => {
      event.preventDefault()
      this.handleNavigation('back')
    })
    this.element.on(eventName, `.${targets.nextYearButton}`, event => {
      event.preventDefault()
      this.handleNavigation('nextYear')
    })
    this.element.on(eventName, `.${targets.previousYearButton}`, event => {
      event.preventDefault()
      this.handleNavigation('previousYear')
    })
    this.element.on(eventName, `.${targets.todayButton}`, event => {
      event.preventDefault()
      this.handleNavigation('today')
    })
    // Keyboard navigation on day buttons
    this.element.on('keydown.clndr', `.${targets.day}`, event =>
      this.handleDayKeyDown(event as any)
    )
  }

  private handleDayClick(event: JQuery.TriggeredEvent): void {
    const target = this.resolveEventElement(
      event,
      `.${this.options.targets?.day || 'day'}`
    )
    if (!target) return
    const $target = $(target)
    const adjacentHandled = this.handleAdjacentDay(
      $target as JQuery<HTMLElement>
    )

    if (this.options.trackSelectedDate && adjacentHandled !== true) {
      const inactiveClass = this.options.classes?.inactive || 'inactive'
      const selectedClass = this.options.classes?.selected || 'selected'
      const selectedTokens = selectedClass.split(/\s+/).filter(Boolean)
      const isInactive = $target.hasClass(inactiveClass)
      const ignoreInactive = this.options.ignoreInactiveDaysInSelection === true
      if (!isInactive || !ignoreInactive) {
        const iso = this.getTargetDateString(target)
        if (iso) {
          this.core.setSelectedDate(iso)
          for (const token of selectedTokens) {
            this.container.find(`.${token}`).removeClass(token)
            if (token) {
              target.classList.remove(token)
            }
          }
          this.highlightSelectedDay(iso, selectedClass, selectedTokens)
          $target.addClass(selectedClass)
          target.className = `${target.className} ${selectedClass}`.trim()
          // Keep ARIA pressed state in sync without requiring a full re-render
          const daySel = `.${this.options.targets?.day || 'day'}`
          this.container.find(`${daySel}`).attr('aria-pressed', 'false')
          $target.attr('aria-pressed', 'true')
        }
      }
    }

    if (this.options.clickEvents?.click) {
      const payload = this.buildTargetObject(target, true)
      this.options.clickEvents.click.apply(this.apiContext ?? this, [payload])
    }
  }

  private handleEmptyClick(event: JQuery.TriggeredEvent): void {
    const target = this.resolveEventElement(
      event,
      `.${this.options.targets?.empty || 'empty'}`
    )
    if (!target) return
    const $target = $(target)
    this.handleAdjacentDay($target as JQuery<HTMLElement>)

    if (this.options.clickEvents?.click) {
      const payload = this.buildTargetObject(target, false)
      this.options.clickEvents.click.apply(this.apiContext ?? this, [payload])
    }
  }

  private handleNavigation(
    action: 'forward' | 'back' | 'nextYear' | 'previousYear' | 'today'
  ): void {
    let change: StateChange<T> | null = null
    switch (action) {
      case 'forward':
        change = this.core.forward()
        break
      case 'back':
        change = this.core.back()
        break
      case 'nextYear':
        change = this.core.nextYear()
        break
      case 'previousYear':
        change = this.core.previousYear()
        break
      case 'today':
        change = this.core.today()
        break
    }

    if (!change) return

    this.applyChange(change, {
      action: action === 'today' ? 'today' : undefined,
      fireCallbacks: true
    })
  }

  private triggerEvents(change: StateChange<T>): void {
    const events = this.options.clickEvents
    if (!events) return

    const prev = change.previous
    const curr = change.current
    const newStart = curr.intervalStart
    const oldStart = prev.intervalStart
    const newEnd = curr.intervalEnd
    const oldEnd = prev.intervalEnd

    const monthArg: [any] = [curr.month.value()]
    const intervalArg: [any, any] = [
      curr.intervalStart.value(),
      curr.intervalEnd.value()
    ]

    const nextInterval = newStart.isAfter(oldStart)
    const prevInterval = newStart.isBefore(oldStart)
    const intervalChanged = nextInterval || prevInterval

    const monthChanged = !curr.intervalStart.hasSame(
      prev.intervalStart,
      'month'
    )
    const yearChanged = !curr.intervalStart.hasSame(prev.intervalStart, 'year')

    const lengthOpt = this.options.lengthOfTime || {}

    if (lengthOpt.days || lengthOpt.months) {
      if (nextInterval && events.nextInterval) {
        events.nextInterval.apply(this.apiContext ?? this, intervalArg)
      }

      if (prevInterval && events.previousInterval) {
        events.previousInterval.apply(this.apiContext ?? this, intervalArg)
      }

      if (intervalChanged && events.onIntervalChange) {
        events.onIntervalChange.apply(this.apiContext ?? this, intervalArg)
      }
    } else {
      if (monthChanged && newStart.isAfter(oldStart) && events.nextMonth) {
        events.nextMonth.apply(this.apiContext ?? this, monthArg)
      }

      if (monthChanged && newStart.isBefore(oldStart) && events.previousMonth) {
        events.previousMonth.apply(this.apiContext ?? this, monthArg)
      }

      if (monthChanged && events.onMonthChange) {
        events.onMonthChange.apply(this.apiContext ?? this, monthArg)
      }

      if (yearChanged && newStart.isAfter(oldStart) && events.nextYear) {
        events.nextYear.apply(this.apiContext ?? this, monthArg)
      }

      if (yearChanged && newStart.isBefore(oldStart) && events.previousYear) {
        events.previousYear.apply(this.apiContext ?? this, monthArg)
      }

      if (yearChanged && events.onYearChange) {
        events.onYearChange.apply(this.apiContext ?? this, monthArg)
      }
    }
  }

  private buildTargetObject(
    element: Element,
    targetWasDay: boolean
  ): ClndrClickTarget {
    const target: ClndrClickTarget = {
      element,
      date: null,
      events: []
    }

    if (!targetWasDay) return target

    const iso = this.getTargetDateString(element)
    if (!iso) return target

    const date = this.adapter.fromISO(iso)
    target.date = date.value() as any
    target.events = this.findEventsForDate(date)
    return target
  }

  private findEventsForDate(date: AdapterDate<T>): ClndrEvent[] {
    const events = (this.options.events || []) as RuntimeEvent[]
    const dayStart = date.startOf('day')
    const dayEnd = date.endOf('day')

    return events.filter(ev => {
      const start = ev._clndrStartDateObject
      const end = ev._clndrEndDateObject
      if (!start || !end) return false
      const beforeStart = end.isBefore(dayStart)
      const afterEnd = start.isAfter(dayEnd)
      return !(beforeStart || afterEnd)
    })
  }

  private getTargetDateString(element: Element): string | null {
    const className = element.className || ''
    const index = className.indexOf('calendar-day-')
    if (index === -1) return null
    return className.substr(index + 13, 10)
  }

  private handleAdjacentDay($target: JQuery<HTMLElement>): boolean {
    if (!this.options.adjacentDaysChangeMonth) return false
    const classes = this.options.classes || {}
    if ($target.hasClass(classes.lastMonth || 'last-month')) {
      const change = this.core.back()
      if (change) {
        this.applyChange(change, { fireCallbacks: true })
      }
      return true
    }
    if ($target.hasClass(classes.nextMonth || 'next-month')) {
      const change = this.core.forward()
      if (change) {
        this.applyChange(change, { fireCallbacks: true })
      }
      return true
    }
    return false
  }

  private applyConstraintClasses(): void {
    const constraints = this.core.getConstraints()
    const inactive = this.options.classes?.inactive || 'inactive'
    const targets = this.options.targets!

    const toggles: Array<[keyof ConstraintState, string | undefined]> = [
      ['previous', targets.previousButton],
      ['next', targets.nextButton],
      ['previousYear', targets.previousYearButton],
      ['nextYear', targets.nextYearButton],
      ['today', targets.todayButton]
    ]

    for (const [key, selector] of toggles) {
      if (!selector) continue
      const disabled = !constraints[key]
      const $els = this.element.find(`.${selector}`)
      $els.toggleClass(inactive, disabled)
      // Propagate disabled state to assistive tech and native buttons when present
      $els.attr('aria-disabled', disabled ? 'true' : (null as any))
      try {
        ;($els as any).prop('disabled', disabled)
      } catch {
        // Non-button elements may ignore this; safe to continue
      }
    }
  }

  private applyAriaStates(): void {
    const selectedClass = this.options.classes?.selected || 'selected'
    const inactiveClass = this.options.classes?.inactive || 'inactive'
    const daySel = `.${this.options.targets?.day || 'day'}`
    const $days = this.container.find(daySel)
    $days.attr('aria-pressed', 'false')
    this.container
      .find(`${daySel}.${selectedClass}`)
      .attr('aria-pressed', 'true')
    const $inactiveDays = this.container.find(`${daySel}.${inactiveClass}`)
    $inactiveDays.attr('aria-disabled', 'true')
    try {
      ;($inactiveDays as any).prop('disabled', true)
    } catch {
      /* ignore */
    }
  }

  private handleDayKeyDown(event: JQuery.KeyDownEvent): void {
    const target = this.resolveEventElement(
      event as unknown as JQuery.TriggeredEvent,
      `.${this.options.targets?.day || 'day'}`
    )
    if (!target) return
    const key = (event as any).key as string | undefined
    if (!key) return
    const delta: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7
    }
    if (key in delta) {
      event.preventDefault()
      this.moveFocusByDays(target, delta[key])
      return
    }
    if (key === 'Home') {
      event.preventDefault()
      this.moveFocusToWeekEdge(target, 'start')
      return
    }
    if (key === 'End') {
      event.preventDefault()
      this.moveFocusToWeekEdge(target, 'end')
      return
    }
    if (key === 'PageUp') {
      event.preventDefault()
      const shift = (event as any).shiftKey === true
      this.moveFocusByMonths(target, shift ? -12 : -1)
      return
    }
    if (key === 'PageDown') {
      event.preventDefault()
      const shift = (event as any).shiftKey === true
      this.moveFocusByMonths(target, shift ? 12 : 1)
      return
    }
    if (key === ' ') {
      // prevent page scroll; buttons will still fire click
      event.preventDefault()
    }
  }

  private moveFocusByDays(anchorEl: HTMLElement, by: number): void {
    const iso = this.getTargetDateString(anchorEl)
    if (!iso) return
    const date = this.adapter.fromISO(iso)
    const next = by >= 0 ? date.plus({ days: by }) : date.minus({ days: -by })
    const nextIso = this.adapter
      .fromNative(next.value() as any)
      .format('YYYY-MM-DD')
    this.focusByISO(nextIso)
  }

  private moveFocusToWeekEdge(
    anchorEl: HTMLElement,
    which: 'start' | 'end'
  ): void {
    const iso = this.getTargetDateString(anchorEl)
    if (!iso) return
    const date = this.adapter.fromISO(iso)
    const dowISO = date.weekday() % 7
    const offset = which === 'start' ? -dowISO : 6 - dowISO
    this.moveFocusByDays(anchorEl, offset)
  }

  private moveFocusByMonths(anchorEl: HTMLElement, months: number): void {
    const iso = this.getTargetDateString(anchorEl)
    if (!iso) return
    const date = this.adapter.fromISO(iso)
    const moved =
      months >= 0 ? date.plus({ months }) : date.minus({ months: -months })
    const dom = date.day()
    const dim = moved.daysInMonth()
    const clamped = moved
      .startOf('month')
      .plus({ days: Math.min(dom, dim) - 1 })
    const nextIso = clamped.format('YYYY-MM-DD')

    const state = this.core.getState()
    const target = this.adapter.fromISO(nextIso)
    let change: StateChange<any> | null = null
    if (target.isBefore(state.intervalStart)) change = this.core.back()
    else if (target.isAfter(state.intervalEnd)) change = this.core.forward()
    if (change) this.applyChange(change, { fireCallbacks: true })
    this.focusByISO(nextIso)
  }

  private focusByISO(iso: string): void {
    const $el = this.container.find(`.calendar-day-${iso}`).first()
    if ($el && $el.length && !$el.is('[disabled], .inactive')) {
      try {
        ;($el.get(0) as HTMLElement).focus()
        return
      } catch {}
    }
    const state = this.core.getState()
    const target = this.adapter.fromISO(iso)
    let change: StateChange<any> | null = null
    if (target.isBefore(state.intervalStart)) change = this.core.back()
    else if (target.isAfter(state.intervalEnd)) change = this.core.forward()
    if (change) {
      this.applyChange(change, { fireCallbacks: true })
      const again = this.container.find(`.calendar-day-${iso}`).first()
      if (again && again.length) {
        try {
          ;(again.get(0) as HTMLElement).focus()
        } catch {}
      }
    }
  }

  private resolveElement(element: HTMLElement | JQuery | string): JQuery {
    if (typeof element === 'string') {
      return $(element)
    }
    if ((element as any).jquery) {
      return element as JQuery
    }
    return $(element as HTMLElement)
  }

  private assertSingleElement(el: JQuery): void {
    if (el.length === 0) {
      throw new Error('CLNDR: No element found for selector.')
    }
    if (el.length > 1) {
      throw new Error(
        'CLNDR: Multiple elements are not supported per instance.'
      )
    }
  }

  private resolveEventElement(
    event: JQuery.TriggeredEvent,
    selector: string
  ): HTMLElement | null {
    const current = event.currentTarget as HTMLElement | null
    if (current && current.matches(selector)) {
      return current
    }
    const target = event.target as HTMLElement | null
    if (target) {
      const match = target.closest(selector)
      if (match) return match as HTMLElement
    }
    return null
  }

  private highlightSelectedDay(
    iso: string,
    selectedClass: string,
    tokens: string[]
  ): void {
    const target = this.container.find(`.calendar-day-${iso}`).first()
    if (!target.length) return
    target.addClass(selectedClass)
    const el = target.get(0)
    if (!el) return
    for (const token of tokens) {
      if (token) {
        el.classList.add(token)
      }
    }
  }
}
