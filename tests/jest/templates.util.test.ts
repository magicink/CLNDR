import { baseTemplateData, compile } from '../../src/ts/index'
import { createLuxonAdapter } from '../../src/ts/index'

describe('templates utilities', () => {
  test('compile supports nested keys and empty fallback', () => {
    const tpl = compile('Hello <%= user.name %> <%= missing.path %>!')
    const html = tpl({ user: { name: 'World' } })
    expect(html).toBe('Hello World !')
  })

  test('baseTemplateData fills defaults and uses adapter labels', () => {
    const adapter = createLuxonAdapter('en')
    const data = baseTemplateData(adapter, {} as any)
    expect(Array.isArray(data.daysOfTheWeek)).toBe(true)
    expect(data.daysOfTheWeek.length).toBe(7)
    expect(data.days).toEqual([])
    expect(data.month).toBeNull()
    expect(data.year).toBeNull()
  })
})
