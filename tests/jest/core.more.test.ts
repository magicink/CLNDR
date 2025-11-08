import { ClndrCore, createLuxonAdapter } from '../../src/ts/index'

describe('ClndrCore additional coverage', () => {
  const adapter = createLuxonAdapter('en')

  test('getState/getOptions and setSelectedDate variants', () => {
    const core = new ClndrCore(adapter as any, {})
    expect(core.getState()).toBeTruthy()
    const opts = core.getOptions()
    expect(opts).toBeTruthy()

    // string value
    core.setSelectedDate('2020-05-01')
    expect(core.getOptions().selectedDate).toBe('2020-05-01')

    // clear selection
    core.setSelectedDate(null)
    expect(core.getOptions().selectedDate).toBeNull()

    // AdapterDate value -> formatted to YYYY-MM-DD
    core.setSelectedDate(adapter.fromISO('2020-05-02') as any)
    expect(core.getOptions().selectedDate).toBe('2020-05-02')
  })

  test('constraint flags disable navigation and today when out of range', () => {
    const core = new ClndrCore(adapter as any, {
      startWithMonth: '2020-01-15',
      constraints: { startDate: '2020-01-01', endDate: '2020-01-31' }
    })
    const constraints = core.getConstraints()
    expect(constraints.previous).toBe(false)
    expect(constraints.next).toBe(false)
    expect(constraints.previousYear).toBe(false)
    expect(constraints.nextYear).toBe(false)
    expect(constraints.today).toBe(false)

    // Calls return null when disabled
    expect(core.previousYear()).toBeNull()
    expect(core.nextYear()).toBeNull()
    expect(core.forward()).toBeNull()
    expect(core.back()).toBeNull()
  })

  test('today() updates start bounds for month and days intervals', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-03-15T12:00:00Z'))
    // Month mode (default)
    const m = new ClndrCore(adapter as any, { startWithMonth: '2018-01-01' })
    const monthChange = m.today()
    expect(monthChange!.current.month.format('YYYY-MM-DD')).toBe('2024-03-01')

    // Days mode uses weekOffset to pick start day within current week
    const d = new ClndrCore(adapter as any, {
      lengthOfTime: { days: 7, interval: 1 },
      weekOffset: 3
    })
    const change = d.today()
    const start = change.current.intervalStart
    // weekdayIndex(start) === weekOffset
    const startIsoZero = start.weekday() % 7
    const fdow = adapter.firstDayOfWeek() // 0=Sun..6
    let relative = startIsoZero - fdow
    if (relative < 0) relative += 7
    expect(relative).toBe(3)
    jest.useRealTimers()
  })

  test('setMonth guard and string parsing + fallback', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    // Guard when using days/months modes
    const guarded = new ClndrCore(adapter as any, {
      lengthOfTime: { days: 7, interval: 1 }
    })
    expect(guarded.setMonth(0)).toBeNull()
    expect(warn).toHaveBeenCalled()

    // String parsing: long month name
    const core = new ClndrCore(adapter as any, { startWithMonth: '2019-01-01' })
    core.setMonth('February')
    expect(core.getState().month.format('MMMM YYYY')).toBe('February 2019')

    // Unknown text yields an invalid parse with current adapter behavior
    core.setMonth('NotAMonth')
    expect(core.getState().month.format('MMMM YYYY')).toBe('Invalid DateTime')

    warn.mockRestore()
  })

  test('setYear computes correct target month', () => {
    const core = new ClndrCore(adapter as any, { startWithMonth: '2020-05-01' })
    core.setYear(2018)
    expect(core.getState().month.format('YYYY-MM-DD')).toBe('2018-05-01')
  })

  test('setIntervalStart guard and both modes', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    // Guard when lengthOfTime missing
    const a = new ClndrCore(adapter as any, {})
    expect(a.setIntervalStart('2020-01-02')).toBeNull()
    expect(warn).toHaveBeenCalled()

    // Days mode
    const b = new ClndrCore(adapter as any, {
      lengthOfTime: { days: 10, interval: 1 }
    })
    const bChange = b.setIntervalStart('2020-05-15')!
    expect(bChange.current.intervalStart.format('YYYY-MM-DD')).toBe(
      '2020-05-15'
    )
    expect(bChange.current.intervalEnd.format('YYYY-MM-DD')).toBe('2020-05-24')

    // Months mode
    const c = new ClndrCore(adapter as any, {
      lengthOfTime: { months: 3, interval: 1 }
    })
    const cChange = c.setIntervalStart('2020-05-10')!
    expect(cChange.current.intervalStart.format('YYYY-MM-DD')).toBe(
      '2020-05-01'
    )
    expect(cChange.current.intervalEnd.format('YYYY-MM-DD')).toBe('2020-07-31')

    warn.mockRestore()
  })

  test('createDaysObject: showAdjacentMonths false pads empties; forceSixRows pads to 42', () => {
    const core = new ClndrCore(adapter as any, {
      startWithMonth: '2021-05-01',
      showAdjacentMonths: false,
      forceSixRows: true
    })
    const data = core.buildTemplateData()
    expect(Array.isArray(data.days)).toBe(true)
    expect(data.days.length).toBe(42)
    // Expect some cells to be empty class (no day target)
    const empties = data.days.filter(d => String(d.classes).includes('empty'))
    expect(empties.length).toBeGreaterThan(0)
  })

  test('multi-day events apply event class across range', () => {
    const core = new ClndrCore(adapter as any, {
      startWithMonth: '2020-01-01',
      multiDayEvents: {
        startDate: 'start',
        endDate: 'end',
        singleDay: 'date'
      } as any,
      events: [
        { start: '2020-01-05', end: '2020-01-07' } as any,
        { date: '2020-01-15' } as any
      ]
    })
    const data = core.buildTemplateData()
    const hasEvent = (iso: string) =>
      data.days.some(
        d =>
          String(d.classes).includes(`calendar-day-${iso}`) &&
          String(d.classes).includes('event')
      )
    expect(hasEvent('2020-01-05')).toBe(true)
    expect(hasEvent('2020-01-06')).toBe(true)
    expect(hasEvent('2020-01-07')).toBe(true)
    expect(hasEvent('2020-01-15')).toBe(true)
  })

  test('ensureLengthDefaults sets interval to 1 when missing', () => {
    // interval undefined should default to 1
    const core = new ClndrCore(adapter as any, {
      lengthOfTime: { days: 7 } as any
    })
    expect(core.getOptions().lengthOfTime!.interval).toBe(1)
  })
})
