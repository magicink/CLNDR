import { createRenderer, DEFAULT_TEMPLATE } from '../../src/ts/templates'

describe('createRenderer default template behavior', () => {
  const originalUnderscore = (global as any)._

  afterEach(() => {
    if (originalUnderscore === undefined) {
      delete (global as any)._
    } else {
      ;(global as any)._ = originalUnderscore
    }
  })

  test('uses Underscore for DEFAULT_TEMPLATE when available', () => {
    const calls: string[] = []
    ;(global as any)._ = {
      template: (tpl: string) => {
        calls.push(tpl)
        return (_data: any) => 'underscored'
      }
    }

    const renderer = createRenderer({} as any)
    const output = renderer({})

    expect(output).toBe('underscored')
    expect(calls[0]).toBe(DEFAULT_TEMPLATE)
  })

  test('falls back to minimal compiler without Underscore', () => {
    delete (global as any)._

    const renderer = createRenderer({} as any)
    const html = renderer({
      // Minimal data shape; internal compiler only interpolates simple keys
      month: 'June',
      year: '2024',
      daysOfTheWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      numberOfRows: 1,
      days: Array.from({ length: 7 }, (_, i) => ({
        classes: 'day',
        day: String(i + 1)
      }))
    })

    expect(typeof html).toBe('string')
    // Control-flow tags remain when not using underscore
    expect(html).toContain('<%')
  })
})
