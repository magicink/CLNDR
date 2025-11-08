import moment from 'moment'
import { createMomentAdapter } from '../../src/ts/index'

describe('Moment adapter extra coverage', () => {
  const adapter = createMomentAdapter('en')

  test('fromNative wraps a moment instance', () => {
    const m = moment('2020-04-02')
    const a = adapter.fromNative(m as any)
    expect(a.format('YYYY-MM-DD')).toBe('2020-04-02')
    expect(moment.isMoment(a.value())).toBe(true)
  })

  test('withLocale + getLocale switch locales', () => {
    const fr = adapter.withLocale('fr')
    expect(fr.getLocale()).toBe('fr')
    const expected = moment.localeData('fr').weekdaysShort()
    expect(fr.weekdayLabels('short')).toEqual(expected)
  })

  test('normalizeTokens no-op on moment', () => {
    const t = 'YYYY-MM-DD'
    expect(adapter.normalizeTokens(t)).toBe(t)
  })

  test('plus/minus support multiple fields', () => {
    const base = adapter.fromISO('2020-01-01T00:00:00Z')
    const inc = base.plus({ milliseconds: 1000, hours: 1, weeks: 1 })
    const dec = base.minus({ milliseconds: 500, days: 1, months: 1 })
    // Sanity checks: formatting should differ from base
    expect(inc.toISO()).not.toBe(base.toISO())
    expect(dec.toISO()).not.toBe(base.toISO())
  })
})
