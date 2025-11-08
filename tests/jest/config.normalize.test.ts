import moment from 'moment'

import { createMomentAdapter, normalizeOptions } from '../../src/ts/index'

describe('normalizeOptions defaults and merges', () => {
  test('applies sane defaults when options are empty', () => {
    const adapter = createMomentAdapter('en')
    const { options, daysOfTheWeek } = normalizeOptions(adapter, {})

    expect(options.weekOffset).toBe(0)
    expect(options.showAdjacentMonths).toBe(true)
    expect(options.trackSelectedDate).toBe(false)
    expect(options.dateParameter).toBe('date')
    expect(options.adjacentDaysChangeMonth).toBe(false)
    expect(options.forceSixRows).toBeNull()
    expect(options.selectedDate).toBeNull()
    expect(options.ignoreInactiveDaysInSelection).toBeNull()
    expect(options.constraints).toBeNull()
    expect(options.moment).toBeNull()

    // Targets/classes merged with defaults
    expect(options.targets?.nextButton).toBe('clndr-next-button')
    expect(options.classes?.today).toBe('today')

    // Derived weekday labels via adapter
    expect(daysOfTheWeek.length).toBe(7)
  })

  test('merges targets/classes and preserves provided values', () => {
    const adapter = createMomentAdapter('en')
    const { options, daysOfTheWeek } = normalizeOptions(adapter, {
      targets: { day: 'd' },
      classes: { past: 'p' },
      events: [],
      weekOffset: 2
    } as any)

    expect(options.targets?.day).toBe('d')
    expect(options.targets?.nextButton).toBe('clndr-next-button')
    expect(options.classes?.past).toBe('p')
    expect(options.classes?.today).toBe('today')

    // Rotation respected
    const base = Array.from({ length: 7 }, (_, i) =>
      moment().weekday(i).format('dd').charAt(0)
    )
    const expected = [...base.slice(2), ...base.slice(0, 2)]
    expect(daysOfTheWeek).toEqual(expected)
  })
})
