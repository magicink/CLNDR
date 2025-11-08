import { clndr, createLuxonAdapter } from '../../src/ts/index'

describe('facade.clndr API', () => {
  function headerText(el: HTMLElement): string {
    const node = el.querySelector('.month') as HTMLElement | null
    return (node?.textContent || '').trim()
  }

  test('calls ready callback with API context and renders', () => {
    document.body.innerHTML = "<div id='facade1'></div>"
    const el = document.getElementById('facade1') as HTMLElement

    let ctx: any = null
    function ready(this: any) {
      ctx = this
    }

    const api = clndr('#facade1', {
      startWithMonth: '2020-05-01',
      locale: 'en',
      ready
    })

    expect(ctx).toBeTruthy()
    expect(ctx.element).toBe(el)
    expect(headerText(el)).toBe('May 2020')

    // render() returns the API for chaining
    expect(api.render()).toBe(api)
  })

  test('throws when dateLibrary is not "luxon"', () => {
    document.body.innerHTML = "<div id='facade2'></div>"
    expect(() =>
      clndr('#facade2', {
        dateLibrary: 'moment' as any
      })
    ).toThrow(/Moment support has been removed/)
  })

  test('exercises API navigation, setters, and events', () => {
    document.body.innerHTML = "<div id='facade3'></div>"
    const el = document.getElementById('facade3') as HTMLElement

    const api = clndr('#facade3', {
      startWithMonth: '2019-01-10',
      locale: 'en'
    })

    // Initial header
    expect(headerText(el)).toBe('January 2019')

    // next() -> February 2019
    api.next()
    expect(headerText(el)).toBe('February 2019')

    // previous() -> January 2019
    api.previous()
    expect(headerText(el)).toBe('January 2019')

    // nextYear()/previousYear()
    api.nextYear()
    expect(headerText(el)).toBe('January 2020')
    api.previousYear()
    expect(headerText(el)).toBe('January 2019')

    // setMonth(number) uses 0-based (0 = January)
    api.setMonth(0)
    expect(headerText(el)).toBe('January 2019')

    // setYear(number)
    api.setYear(2018)
    expect(headerText(el)).toBe('January 2018')

    // setExtras triggers re-render
    api.setExtras({ foo: 'bar' })
    expect(headerText(el)).toBe('January 2018')

    // Events-related API calls (verify they execute without error)
    api.setEvents([
      { date: '2018-01-05', title: 'A' } as any,
      { date: '2018-01-15', title: 'B' } as any
    ])
    api.addEvents([{ date: '2018-01-20', title: 'C' } as any], false)
    api.render()
    api.removeEvents(ev => String((ev as any).date).startsWith('2018-01'))

    // today() path executes without returning this (no assertion needed)
    api.today()

    // destroy() path
    api.destroy()
  })

  test('uses custom dateAdapter even if dateLibrary is set', () => {
    document.body.innerHTML = "<div id='facade4'></div>"
    const adapter = createLuxonAdapter('en')
    const api = clndr('#facade4', {
      dateAdapter: adapter,
      dateLibrary: 'moment' as any, // ignored due to provided dateAdapter
      startWithMonth: '2020-01-01'
    })
    const el = document.getElementById('facade4') as HTMLElement
    expect(headerText(el)).toBe('January 2020')
    api.destroy()
  })
})
