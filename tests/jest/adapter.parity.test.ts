/**
 * Adapter-backed parity tests: verify the Moment adapter matches
 * Moment.js semantics for formatting, date math, boundaries, and locale
 * surfaces. This suite is adapter-generic and will be reused for Luxon.
 */

import moment from 'moment'

import { createMomentAdapter, type DateAdapter } from '../../src/ts/index'

import { computeWeekdayLabels } from '../../src/ts/config'
import { initState } from '../../src/ts/state'

function fmt(d: any, f: string) {
  return (d.format ? d.format(f) : '') as string
}

describe('DateAdapter(moment): formatting and fields', () => {
  let adapter: DateAdapter
  beforeAll(() => {
    moment.locale('en')
    adapter = createMomentAdapter('en')
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
})

describe('DateAdapter(moment): locale surface and labels', () => {
  test('firstDayOfWeek matches moment locale', () => {
    const en = createMomentAdapter('en')
    const fr = createMomentAdapter('fr')
    expect(en.firstDayOfWeek()).toBe(moment.localeData('en').firstDayOfWeek())
    expect(fr.firstDayOfWeek()).toBe(moment.localeData('fr').firstDayOfWeek())
  })

  test('weekdayLabels return moment locale labels', () => {
    const en = createMomentAdapter('en')
    const ld = moment.localeData('en')
    expect(en.weekdayLabels('narrow')).toEqual(ld.weekdaysMin())
    expect(en.weekdayLabels('short')).toEqual(ld.weekdaysShort())
    expect(en.weekdayLabels('long')).toEqual(ld.weekdays())
  })

  test('setWeekday walks the week relative to locale', () => {
    moment.locale('fr')
    const fr = createMomentAdapter('fr')
    const base = fr.now().startOf('week')
    const labels = Array.from({ length: 7 }, (_, i) =>
      fr.setWeekday(base, i).format('dd')
    )
    const expected = Array.from({ length: 7 }, (_, i) =>
      moment().weekday(i).format('dd')
    )
    expect(labels).toEqual(expected)
  })
})

describe('Config helpers: weekday header rotation', () => {
  test('computeWeekdayLabels rotates by weekOffset', () => {
    const en = createMomentAdapter('en')
    const base = en.weekdayLabels('short')
    const rotated = computeWeekdayLabels(en, { weekOffset: 2 } as any)
    const expected = [...base.slice(2), ...base.slice(0, 2)]
    expect(rotated).toEqual(expected)
  })

  test('computeWeekdayLabels with formatWeekdayHeader callback', () => {
    moment.locale('de')
    const de = createMomentAdapter('de')
    const opts = {
      formatWeekdayHeader: (d: any) => d.format('dd')
    } as any
    const labels = computeWeekdayLabels(de, opts)
    const expected = Array.from({ length: 7 }, (_, i) =>
      moment().weekday(i).format('dd')
    )
    expect(labels).toEqual(expected)
  })
})

describe('State initializer parity (months/days)', () => {
  test('months length with startWithMonth', () => {
    const en = createMomentAdapter('en')
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
    moment.locale('en') // week starts on Sunday; with weekOffset 1 we want Monday
    const en = createMomentAdapter('en')
    const options = {
      lengthOfTime: { days: 14, startDate: '2020-05-06' },
      weekOffset: 1
    } as any
    const state = initState(en, options)

    // Expected: Monday of the week containing 2020-05-06
    const expectedStart = moment('2020-05-06').startOf('week').add(1, 'day')
    const expectedEnd = expectedStart.clone().add(13, 'days').endOf('day')

    expect(state.intervalStart.format('YYYY-MM-DD')).toBe(
      expectedStart.format('YYYY-MM-DD')
    )
    expect(state.intervalEnd.format('YYYY-MM-DD')).toBe(
      expectedEnd.format('YYYY-MM-DD')
    )
  })
})
