/**
 * Tests for the Luxon adapter: token support, boundaries,
 * weekday labels, and state initialization.
 */

import { createLuxonAdapter, type DateAdapter } from '../../src/ts/index'

import { computeWeekdayLabels } from '../../src/ts/config'
import { initState } from '../../src/ts/state'

function fmt(d: any, f: string) {
  return (d.format ? d.format(f) : '') as string
}

describe('DateAdapter(luxon): formatting and fields', () => {
  let adapter: DateAdapter
  beforeAll(() => {
    adapter = createLuxonAdapter('en')
  })

  test('basic format tokens produce expected strings', () => {
    const iso = '2020-05-04'
    const a = adapter.fromISO(iso)
    expect(a.format('YYYY-MM-DD')).toBe('2020-05-04')
    expect(typeof a.format('MMMM')).toBe('string')
    expect(a.format('M/DD')).toBe('5/04')
    expect(typeof a.format('dddd')).toBe('string')
    expect(a.format('dd').length).toBe(2)
  })

  test('startOf/endOf month boundaries', () => {
    const iso = '2020-02-15'
    const a = adapter.fromISO(iso)
    expect(a.startOf('month').format('YYYY-MM-DD')).toBe('2020-02-01')
    expect(a.endOf('month').format('YYYY-MM-DD')).toBe('2020-02-29')
  })

  test('daysInMonth and numeric fields', () => {
    const a1 = adapter.fromISO('2020-02-15') // leap year
    const a2 = adapter.fromISO('2021-02-15')
    expect(a1.daysInMonth()).toBe(29)
    expect(a2.daysInMonth()).toBe(28)
    expect(adapter.fromISO('2020-05-03').weekday()).toBe(7) // Sunday
    expect(adapter.fromISO('2020-05-04').weekday()).toBe(1) // Monday
    expect(adapter.fromISO('2020-05-15').day()).toBe(15)
  })

  test('toISO returns an ISO string', () => {
    const a = adapter.fromISO('2020-05-04')
    const iso = a.toISO()
    expect(typeof iso).toBe('string')
    expect(iso!.startsWith('2020-05-04')).toBe(true)
  })

  test('endOf("week") aligns with firstDayOfWeek mapping', () => {
    const base = '2020-05-04' // Monday
    const aw = adapter.fromISO(base).endOf('week')
    expect(aw.format('YYYY-MM-DD')).toBe('2020-05-09') // Saturday end for en week
  })

  test('comparisons: isBefore/isAfter/hasSame', () => {
    const d1 = adapter.fromISO('2020-05-04')
    const d2 = adapter.fromISO('2020-05-05')
    expect(d1.isBefore(d2)).toBe(true)
    expect(d2.isAfter(d1)).toBe(true)
    expect(d1.hasSame(d2, 'month')).toBe(true)
    expect(d1.hasSame(d2, 'day')).toBe(false)
  })
})

describe('DateAdapter(luxon): locale surface and labels', () => {
  test('weekdayLabels basic values for en', () => {
    const en = createLuxonAdapter('en')
    const expected = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    expect(en.weekdayLabels('short')).toEqual(expected)
  })
})

describe('Config helpers with Luxon: weekday header rotation', () => {
  test('computeWeekdayLabels rotates by weekOffset', () => {
    const en = createLuxonAdapter('en')
    const base = en.weekdayLabels('narrow')
    const rotated = computeWeekdayLabels(en, { weekOffset: 2 } as any)
    const expected = [...base.slice(2), ...base.slice(0, 2)]
    expect(rotated).toEqual(expected)
  })
})

describe('State initializer parity (months/days) with Luxon', () => {
  test('months length with startWithMonth', () => {
    const en = createLuxonAdapter('en')
    const options = {
      lengthOfTime: { months: 2 },
      startWithMonth: '2020-05-01'
    } as any
    const state = initState(en, options)
    expect(state.month.format('YYYY-MM-DD')).toBe('2020-05-01')
    expect(state.intervalStart.format('YYYY-MM-DD')).toBe('2020-05-01')
    expect(state.intervalEnd.format('YYYY-MM-DD')).toBe('2020-06-30')
  })

  test('days length with startDate and weekOffset (Monday start)', () => {
    const en = createLuxonAdapter('en')
    const options = {
      lengthOfTime: { days: 14, startDate: '2020-05-06' },
      weekOffset: 1
    } as any
    const state = initState(en, options)

    // Monday of the week containing 2020-05-06 is 2020-05-04; plus 13 days
    expect(state.intervalStart.format('YYYY-MM-DD')).toBe('2020-05-04')
    expect(state.intervalEnd.format('YYYY-MM-DD')).toBe('2020-05-17')
  })

  test('fromFormat parses with legacy tokens and fromNative wraps JS Date and DateTime', () => {
    const en = createLuxonAdapter('en')
    const a = en.fromFormat('2020-05-04', 'YYYY-MM-DD')
    expect(a.format('YYYY-MM-DD')).toBe('2020-05-04')

    // fromNative path: JS Date
    const nd = en.fromNative(new Date('2020-05-04T12:00:00Z') as any)
    expect(nd.format('YYYY-MM-DD')).toBe('2020-05-04')

    // fromNative path: DateTime
    // Construct a DateTime via fromISO and feed to fromNative
    const dt = en.fromISO('2020-05-05').value() as any
    const ndt = en.fromNative(dt)
    expect(ndt.format('YYYY-MM-DD')).toBe('2020-05-05')
  })

  test('firstDayOfWeek returns Monday for fr and now() covers zone/locale', () => {
    const fr = createLuxonAdapter('fr', 'UTC')
    expect(fr.firstDayOfWeek()).toBe(1)
    // Exercise now() to cover locale + zone plumbing lines
    const now = fr.now()
    expect(typeof now.toISO()).toBe('string')
  })
})
