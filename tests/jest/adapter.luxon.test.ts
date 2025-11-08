/**
 * Parity tests for the Luxon adapter against Moment's behavior
 * for common tokens and calendar state boundaries.
 */

import moment from 'moment'

import { createLuxonAdapter, type DateAdapter } from '../../src/ts/index'

import { computeWeekdayLabels } from '../../src/ts/config'
import { initState } from '../../src/ts/state'

function fmt(d: any, f: string) {
  return (d.format ? d.format(f) : '') as string
}

describe('DateAdapter(luxon): formatting and fields', () => {
  let adapter: DateAdapter
  beforeAll(() => {
    moment.locale('en')
    adapter = createLuxonAdapter('en')
  })

  test('basic format tokens match moment', () => {
    const iso = '2020-05-04'
    const a = adapter.fromISO(iso)
    const m = moment(iso)
    const tokens = ['YYYY-MM-DD', 'MMMM', 'M/DD', 'dddd', 'dd']
    for (const t of tokens) {
      expect(a.format(t)).toBe(m.format(t))
    }
  })

  test('startOf/endOf month boundaries', () => {
    const iso = '2020-02-15'
    const a = adapter.fromISO(iso)
    const m = moment(iso)
    expect(a.startOf('month').format('YYYY-MM-DD')).toBe(
      m.startOf('month').format('YYYY-MM-DD')
    )
    expect(a.endOf('month').format('YYYY-MM-DD')).toBe(
      m.endOf('month').format('YYYY-MM-DD')
    )
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

  test('endOf("week") aligns with moment locale semantics (en)', () => {
    const base = '2020-05-04' // Monday
    const aw = adapter.fromISO(base).endOf('week')
    const mw = moment(base).endOf('week')
    expect(aw.format('YYYY-MM-DD')).toBe(mw.format('YYYY-MM-DD'))
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
    moment.locale('en')
    const en = createLuxonAdapter('en')
    const options = {
      lengthOfTime: { days: 14, startDate: '2020-05-06' },
      weekOffset: 1
    } as any
    const state = initState(en, options)

    const expectedStart = moment('2020-05-06').startOf('week').add(1, 'day')
    const expectedEnd = expectedStart.clone().add(13, 'days').endOf('day')

    expect(state.intervalStart.format('YYYY-MM-DD')).toBe(
      expectedStart.format('YYYY-MM-DD')
    )
    expect(state.intervalEnd.format('YYYY-MM-DD')).toBe(
      expectedEnd.format('YYYY-MM-DD')
    )
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
