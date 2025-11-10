import { clndr } from '../../src/ts/index'

function renderDefaultLike(data: any) {
  const headers = data.daysOfTheWeek
    .map((d: string) => `<div class="header-day">${d}</div>`) // simple header row
    .join('')
  const cells = data.days
    .map((day: any) => {
      const props = day.properties || {}
      const ariaCurrent = props.isToday ? ' aria-current="date"' : ''
      const ariaDisabled = props.isInactive
        ? ' aria-disabled="true" disabled'
        : ''
      return `
        <button type="button" class="${day.classes}"${ariaCurrent}${ariaDisabled} aria-label="${day.day}">${day.day}</button>
      `
    })
    .join('')
  return `
    <div class="clndr-controls" role="toolbar">
      <button class="clndr-previous-year-button" type="button" aria-label="Previous year">&laquo;</button>
      <button class="clndr-previous-button" type="button" aria-label="Previous month">&lsaquo;</button>
      <h2 class="month" aria-live="polite">${data.month ?? ''} ${data.year ?? ''}</h2>
      <button class="clndr-next-button" type="button" aria-label="Next month">&rsaquo;</button>
      <button class="clndr-next-year-button" type="button" aria-label="Next year">&raquo;</button>
      <button class="clndr-today-button" type="button" aria-label="Go to today">Today</button>
    </div>
    <div class="clndr-grid">
      <div class="days-of-the-week">${headers}</div>
      <div class="days">${cells}</div>
    </div>
  `
}

function q(sel: string, root: ParentNode = document): HTMLElement {
  const el = root.querySelector(sel) as HTMLElement | null
  if (!el) throw new Error(`Missing element: ${sel}`)
  return el
}

describe('Default template keyboard accessibility', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('Arrow keys move focus by day/week', () => {
    document.body.innerHTML = "<div id='kb1'></div>"
    const host = q('#kb1')

    clndr('#kb1', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderDefaultLike
    })

    const d10 = q('.calendar-day-2018-01-10', host)
    d10.focus()

    // ArrowRight -> 11
    d10.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true
      })
    )
    expect((document.activeElement as HTMLElement).className).toContain(
      'calendar-day-2018-01-11'
    )

    // ArrowLeft -> back to 10
    const d11 = q('.calendar-day-2018-01-11', host)
    d11.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true
      })
    )
    expect((document.activeElement as HTMLElement).className).toContain(
      'calendar-day-2018-01-10'
    )

    // ArrowUp from 10 -> 3
    const d10b = q('.calendar-day-2018-01-10', host)
    d10b.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true
      })
    )
    expect((document.activeElement as HTMLElement).className).toContain(
      'calendar-day-2018-01-03'
    )

    // ArrowDown from 3 -> 10
    const d3 = q('.calendar-day-2018-01-03', host)
    d3.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true
      })
    )
    expect((document.activeElement as HTMLElement).className).toContain(
      'calendar-day-2018-01-10'
    )
  })

  test('Home/End move to week edges', () => {
    document.body.innerHTML = "<div id='kb2'></div>"
    const host = q('#kb2')

    clndr('#kb2', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderDefaultLike
    })

    const d10 = q('.calendar-day-2018-01-10', host)
    d10.focus()
    d10.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
        cancelable: true
      })
    )
    expect((document.activeElement as HTMLElement).className).toContain(
      'calendar-day-2018-01-07'
    )

    const d7 = q('.calendar-day-2018-01-07', host)
    d7.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
        cancelable: true
      })
    )
    expect((document.activeElement as HTMLElement).className).toContain(
      'calendar-day-2018-01-13'
    )
  })

  test('PageUp/PageDown navigate months and keep day-of-month when possible', () => {
    document.body.innerHTML = "<div id='kb3'></div>"
    const host = q('#kb3')

    clndr('#kb3', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderDefaultLike
    })

    // Start at Jan 10
    const d10 = q('.calendar-day-2018-01-10', host)
    d10.focus()

    // PageUp -> Dec 10, 2017 and header updates
    d10.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'PageUp',
        bubbles: true,
        cancelable: true
      })
    )
    expect(q('.month', host).textContent!.trim()).toBe('December 2017')
    expect((document.activeElement as HTMLElement).className).toContain(
      'calendar-day-2017-12-10'
    )

    // PageDown -> back to Jan 10, 2018
    const dDec10 = q('.calendar-day-2017-12-10', host)
    dDec10.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'PageDown',
        bubbles: true,
        cancelable: true
      })
    )
    expect(q('.month', host).textContent!.trim()).toBe('January 2018')
    expect((document.activeElement as HTMLElement).className).toContain(
      'calendar-day-2018-01-10'
    )
  })

  test('Space prevents default on day buttons', () => {
    document.body.innerHTML = "<div id='kb4'></div>"
    const host = q('#kb4')

    clndr('#kb4', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderDefaultLike
    })

    const d10 = q('.calendar-day-2018-01-10', host)
    d10.focus()
    const ev = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true
    })
    const preventedBefore = ev.defaultPrevented
    d10.dispatchEvent(ev)
    expect(preventedBefore).toBe(false)
    expect(ev.defaultPrevented).toBe(true)
  })

  test('aria-pressed reflects selected day when tracking selection', () => {
    document.body.innerHTML = "<div id='kb5'></div>"
    const host = q('#kb5')

    clndr('#kb5', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      trackSelectedDate: true,
      render: renderDefaultLike
    })

    const d15 = q('.calendar-day-2018-01-15', host)
    d15.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(d15.getAttribute('aria-pressed')).toBe('true')

    const d16 = q('.calendar-day-2018-01-16', host)
    d16.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(d16.getAttribute('aria-pressed')).toBe('true')
    // previously selected should be false now
    expect(d15.getAttribute('aria-pressed')).toBe('false')
  })
})
