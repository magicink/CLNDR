import { createLuxonAdapter, initState } from '../../src/ts/index'

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
})
