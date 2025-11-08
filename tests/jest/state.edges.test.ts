import { createLuxonAdapter, initState } from '../../src/ts/index'
import { DateTime } from 'luxon'

describe('initState edge paths', () => {
  test('default path uses adapter.now() when no options provided', () => {
    const adapter = createLuxonAdapter('en')
    jest.useFakeTimers().setSystemTime(new Date('2025-11-07T12:00:00Z'))

    const state = initState(adapter, {} as any)
    expect(state.month.format('YYYY-MM-DD')).toBe('2025-11-01')
    expect(state.intervalStart.format('YYYY-MM-DD')).toBe('2025-11-01')
    expect(state.intervalEnd.format('YYYY-MM-DD')).toBe('2025-11-30')

    jest.useRealTimers()
  })

  test('fromNative/ISO path for startWithMonth + selectedDate', () => {
    const adapter = createLuxonAdapter('en')
    const state = initState(adapter, {
      startWithMonth: '2020-03-01',
      selectedDate: '2020-03-15'
    } as any)

    expect(state.month.format('YYYY-MM-DD')).toBe('2020-03-01')
    expect(state.intervalStart.format('YYYY-MM-DD')).toBe('2020-03-01')
    expect(state.intervalEnd.format('YYYY-MM-DD')).toBe('2020-03-31')
    expect(state.selectedDate?.format('YYYY-MM-DD')).toBe('2020-03-15')
  })

  test('parses numeric timestamp for startWithMonth', () => {
    const adapter = createLuxonAdapter('en')
    const ts = new Date('2021-08-15T12:00:00Z').getTime()
    const state = initState(adapter, { startWithMonth: ts } as any)
    expect(state.month.format('YYYY-MM-DD')).toBe('2021-08-01')
  })

  test('object with value() uses fromNative (AdapterDate wrapper)', () => {
    const adapter = createLuxonAdapter('en')
    const wrapper = adapter.fromISO('2021-04-10') as any
    const state = initState(adapter, { selectedDate: wrapper } as any)
    expect(state.selectedDate?.format('YYYY-MM-DD')).toBe('2021-04-10')
  })

  test('moment-like object warns once and uses toISOString when provided', () => {
    const adapter = createLuxonAdapter('en')
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const iso = new Date('2020-06-15T12:00:00Z').toISOString()
    const momentLike = {
      _isAMomentObject: true,
      isSame: () => true,
      format: () => 'ignored',
      clone: () => ({}),
      toISOString: () => iso
    }
    const state = initState(adapter, { selectedDate: momentLike } as any)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(state.selectedDate?.format('YYYY-MM-DD')).toBe('2020-06-15')
    warn.mockRestore()
  })

  test('fallback to fromNative for plain objects', () => {
    const adapter = createLuxonAdapter('en')
    const state = initState(adapter, { selectedDate: {} } as any)
    expect(state.selectedDate).not.toBeNull()
  })

  test('startWithMonth with days range sets intervalEnd via days rule', () => {
    const adapter = createLuxonAdapter('en')
    const state = initState(adapter, {
      startWithMonth: '2020-02-01',
      lengthOfTime: { days: 10, interval: 1 } as any
    } as any)
    expect(state.intervalStart.format('YYYY-MM-DD')).toBe('2020-02-01')
    expect(state.intervalEnd.format('YYYY-MM-DD')).toBe('2020-02-10')
  })
})
