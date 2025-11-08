import moment from 'moment'

import { createMomentAdapter, initState } from '../../src/ts/index'

describe('initState edge paths', () => {
  test('default path uses adapter.now() when no options provided', () => {
    const adapter = createMomentAdapter('en')
    const originalNow = moment.now
    moment.now = () => new Date('2025-11-07T12:00:00Z').valueOf()

    const state = initState(adapter, {} as any)
    expect(state.month.format('YYYY-MM-DD')).toBe('2025-11-01')
    expect(state.intervalStart.format('YYYY-MM-DD')).toBe('2025-11-01')
    expect(state.intervalEnd.format('YYYY-MM-DD')).toBe('2025-11-30')

    moment.now = originalNow
  })

  test('fromNative path for startWithMonth + selectedDate', () => {
    const adapter = createMomentAdapter('en')
    const start = moment('2020-03-01')
    const selected = moment('2020-03-15')
    const state = initState(adapter, {
      startWithMonth: start,
      selectedDate: selected
    } as any)

    expect(state.month.format('YYYY-MM-DD')).toBe('2020-03-01')
    expect(state.intervalStart.format('YYYY-MM-DD')).toBe('2020-03-01')
    expect(state.intervalEnd.format('YYYY-MM-DD')).toBe('2020-03-31')
    expect(state.selectedDate?.format('YYYY-MM-DD')).toBe('2020-03-15')
  })
})
