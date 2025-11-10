import { clndr } from '../../src/ts/index'

function headerText(el: HTMLElement): string {
  const node = el.querySelector('.month') as HTMLElement | null
  return (node?.textContent || '').trim()
}

describe('ClndrDOM interactions', () => {
  const renderWithControls = (data: any) => {
    const headers = data.daysOfTheWeek
      .map((d: string) => `<td class="header-day">${d}</td>`)
      .join('')
    const cells = data.days
      .map(
        (day: any) =>
          `<div class="${day.classes}"><div class="day-contents">${day.day}</div></div>`
      )
      .join('')
    return `
      <div class="clndr-controls">
        <div class="clndr-previous-button"></div>
        <div class="clndr-previous-year-button"></div>
        <div class="clndr-today-button"></div>
        <div class="month">${data.month ?? ''} ${data.year ?? ''}</div>
        <div class="clndr-next-year-button"></div>
        <div class="clndr-next-button"></div>
      </div>
      <table class="clndr-table"><thead><tr class="header-days">${headers}</tr></thead></table>
      <div class="days">${cells}</div>
      <div class="empty" id="__empty__"></div>
    `
  }

  test('navigation buttons trigger month/year callbacks and re-render', () => {
    document.body.innerHTML = "<div id='cal'></div>"
    const el = document.getElementById('cal') as HTMLElement

    const calls: Record<string, number> = {
      nextMonth: 0,
      previousMonth: 0,
      onMonthChange: 0,
      nextYear: 0,
      previousYear: 0,
      onYearChange: 0
    }

    clndr('#cal', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderWithControls,
      clickEvents: {
        nextMonth() {
          calls.nextMonth++
        },
        previousMonth() {
          calls.previousMonth++
        },
        onMonthChange() {
          calls.onMonthChange++
        },
        nextYear() {
          calls.nextYear++
        },
        previousYear() {
          calls.previousYear++
        },
        onYearChange() {
          calls.onYearChange++
        }
      }
    })

    // next month
    const nextBtn = el.querySelector('.clndr-next-button') as HTMLElement
    nextBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(headerText(el)).toBe('February 2018')
    expect(calls.nextMonth).toBe(1)
    expect(calls.onMonthChange).toBe(1)

    // previous month
    const prevBtn = el.querySelector('.clndr-previous-button') as HTMLElement
    prevBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(headerText(el)).toBe('January 2018')
    expect(calls.previousMonth).toBe(1)
    expect(calls.onMonthChange).toBe(2)

    // next year
    const nextYearBtn = el.querySelector(
      '.clndr-next-year-button'
    ) as HTMLElement
    nextYearBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(headerText(el)).toBe('January 2019')
    expect(calls.nextYear).toBe(1)
    expect(calls.onYearChange).toBe(1)

    // previous year
    const prevYearBtn = el.querySelector(
      '.clndr-previous-year-button'
    ) as HTMLElement
    prevYearBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(headerText(el)).toBe('January 2018')
    expect(calls.previousYear).toBe(1)
    expect(calls.onYearChange).toBe(2)
  })

  test('today button triggers today callback', () => {
    document.body.innerHTML = "<div id='cal2'></div>"
    const el = document.getElementById('cal2') as HTMLElement

    let todayCalls = 0
    clndr('#cal2', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderWithControls,
      clickEvents: {
        today() {
          todayCalls++
        }
      }
    })

    const todayBtn = el.querySelector('.clndr-today-button') as HTMLElement
    todayBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(todayCalls).toBe(1)
  })

  // Day click/doneRendering/selection is covered in other suites; here we focus on navigation/event wiring.

  test('adjacent day clicks: disabled by default, enabled when configured', () => {
    document.body.innerHTML = "<div id='cal4a'></div><div id='cal4b'></div>"
    const a = document.getElementById('cal4a') as HTMLElement
    const b = document.getElementById('cal4b') as HTMLElement

    // Default: click on last-month should not change header
    clndr('#cal4a', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderWithControls
    })
    const lastA = a.querySelector('.last-month') as HTMLElement
    const beforeA = headerText(a)
    lastA.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(headerText(a)).toBe(beforeA)

    // Enabled: click on next-month should advance
    clndr('#cal4b', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderWithControls,
      adjacentDaysChangeMonth: true
    })
    const nextB = b.querySelector('.next-month') as HTMLElement
    nextB.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(headerText(b)).toBe('February 2018')
  })

  test('selection honors ignoreInactiveDaysInSelection and adds tokens', () => {
    document.body.innerHTML = "<div id='cal5a'></div><div id='cal5b'></div>"
    const a = document.getElementById('cal5a') as HTMLElement
    const b = document.getElementById('cal5b') as HTMLElement

    // Inactive after the 10th; ignoreInactive true -> no selection applied
    clndr('#cal5a', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderWithControls,
      trackSelectedDate: true,
      ignoreInactiveDaysInSelection: true,
      constraints: { endDate: '2018-01-10' }
    })
    const d1 = a.querySelector('.calendar-day-2018-01-15') as HTMLElement
    d1.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(d1.className.includes('selected')).toBe(false)

    // ignoreInactive false + custom tokens add both classes
    clndr('#cal5b', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderWithControls,
      trackSelectedDate: true,
      ignoreInactiveDaysInSelection: false,
      constraints: { endDate: '2018-01-10' },
      classes: { selected: 'selected chosen' } as any
    })
    const d2 = b.querySelector('.calendar-day-2018-01-15') as HTMLElement
    d2.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const d2Now = b.querySelector('.calendar-day-2018-01-15') as HTMLElement
    expect(d2Now.className.includes('selected')).toBe(true)
    expect(d2Now.className.includes('chosen')).toBe(true)
  })

  test('applyConstraintClasses toggles inactive on nav controls', () => {
    document.body.innerHTML = "<div id='cal6'></div>"
    const el = document.getElementById('cal6') as HTMLElement

    clndr('#cal6', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderWithControls,
      constraints: { startDate: '2018-01-01', endDate: '2018-01-31' }
    })

    const hasInactive = (sel: string) =>
      (el.querySelector(sel) as HTMLElement).classList.contains('inactive')

    expect(hasInactive('.clndr-previous-button')).toBe(true)
    expect(hasInactive('.clndr-next-button')).toBe(true)
    expect(hasInactive('.clndr-previous-year-button')).toBe(true)
    expect(hasInactive('.clndr-next-year-button')).toBe(true)
  })

  test('useTouchEvents binds touchstart for navigation', () => {
    document.body.innerHTML = "<div id='cal7'></div>"
    const el = document.getElementById('cal7') as HTMLElement

    clndr('#cal7', {
      startWithMonth: '2018-01-01',
      locale: 'en',
      render: renderWithControls,
      useTouchEvents: true
    })

    const nextBtn = el.querySelector('.clndr-next-button') as HTMLElement
    nextBtn.dispatchEvent(new Event('touchstart', { bubbles: true }))
    expect(headerText(el)).toBe('February 2018')
  })

  test('throws on missing or multiple elements', () => {
    document.body.innerHTML =
      "<div id='one'></div><div class='many'></div><div class='many'></div>"
    expect(() => clndr('#missing')).toThrow(/No element/)
    expect(() => clndr('.many')).toThrow(/Multiple elements/)
  })
})
