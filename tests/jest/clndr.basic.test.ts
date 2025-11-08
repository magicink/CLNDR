/**
 * Basic render and API tests for CLNDR using jsdom + jQuery.
 */

describe('CLNDR basic rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cal"></div>'
  })

  test('renders with custom template into container', () => {
    const $ = (global as any).jQuery
    const api = $('#cal').clndr({
      render: (data: any) => {
        const headers = data.daysOfTheWeek
          .map((d: string) => `<td class="header-day">${d}</td>`) // assertion selector
          .join('')
        return `
          <div class="clndr-controls"></div>
          <table class="clndr-table"><thead><tr class="header-days">${headers}</tr></thead></table>
        `
      }
    })
    expect(api).toBeTruthy()
    expect(document.querySelectorAll('.clndr-controls').length).toBeGreaterThan(
      0
    )
    expect(
      document.querySelectorAll('.header-day').length >= 7 ||
        document.querySelectorAll('.days .header-day').length >= 7
    ).toBeTruthy()

    // Snapshot the container HTML (custom minimal template)
    expect(document.getElementById('cal')!.innerHTML).toMatchSnapshot()
  })

  test('forward/back changes month and triggers re-render', () => {
    const $ = (global as any).jQuery
    const api = $('#cal').clndr({
      render: (data: any) => {
        const headers = data.daysOfTheWeek
          .map((d: string) => `<td class="header-day">${d}</td>`) // assertion selector
          .join('')
        return `
          <div class="clndr-controls"></div>
          <div class="month">${data.month ?? ''}</div>
          <table class="clndr-table"><thead><tr class="header-days">${headers}</tr></thead></table>
        `
      }
    })
    const first = document.querySelector('.month')?.textContent
    api.forward()
    const second = document.querySelector('.month')?.textContent
    api.back()
    const third = document.querySelector('.month')?.textContent

    expect(second).not.toEqual(first)
    expect(third).toEqual(first)
  })
})

describe('TS facade factory', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cal2"></div>'
  })

  test('creates an instance via facade', async () => {
    const { clndr } = await import('../../src/ts/index')
    const api = clndr('#cal2', {
      render: (data: any) => {
        const headers = data.daysOfTheWeek
          .map((d: string) => `<td class="header-day">${d}</td>`) // assertion selector
          .join('')
        return `
          <div class="clndr-controls"></div>
          <table class="clndr-table"><thead><tr class="header-days">${headers}</tr></thead></table>
        `
      }
    })
    expect(api).toBeTruthy()
    expect(typeof (api as any).render).toBe('function')
  })
})

describe('CLNDR config and state', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cal3"></div>'
  })

  test('weekly interval snapshot similar to demo header', () => {
    const $ = (global as any).jQuery
    jest.useFakeTimers().setSystemTime(new Date('2025-11-07T12:00:00Z'))
    const api = $('#cal3').clndr({
      lengthOfTime: {
        days: 14,
        interval: 7,
        startDate: '2025-11-02'
      },
      render: (data: any) => {
        const headers = data.daysOfTheWeek
          .map((d: string) => `<div class="header-day">${d}</div>`) // assertion selector
          .join('')
        const cells = data.days
          .map((day: any) => `<div class="${day.classes}">${day.day}</div>`)
          .join('')
        // Demo-like header with interval range
        const start = data.intervalStart?.format
          ? data.intervalStart.format('M/DD')
          : ''
        const end = data.intervalEnd?.format
          ? data.intervalEnd.format('M/DD')
          : ''
        return `
          <div class="clndr">
            <div class="clndr-controls">
              <div class="clndr-previous-button">&lsaquo;</div>
              <div class="month">${start} &mdash; ${end}</div>
              <div class="clndr-next-button">&rsaquo;</div>
            </div>
            <div class="clndr-grid">
              <div class="days-of-the-week">${headers}<div class="days">${cells}</div></div>
            </div>
          </div>
        `
      }
    })
    expect(api).toBeTruthy()
    expect(document.getElementById('cal3')!.innerHTML).toMatchSnapshot()
    jest.useRealTimers()
  })

  test('trackSelectedDate toggles selected class on click', () => {
    const $ = (global as any).jQuery
    const api = $('#cal3').clndr({
      trackSelectedDate: true,
      render: (data: any) => {
        const cells = data.days
          .map((day: any) => `<div class="${day.classes}">${day.day}</div>`)
          .join('')
        return `
          <div class="clndr-controls">
            <div class="clndr-previous-button"></div>
            <div class="clndr-next-button"></div>
          </div>
          <div class="days">${cells}</div>
        `
      }
    })

    const selectable = document.querySelector(
      '.day:not(.inactive)'
    ) as HTMLElement
    expect(selectable).toBeTruthy()

    selectable.click()

    expect(selectable.className).toMatch(/selected/)
    expect((api as any).options.selectedDate).toBeTruthy()
  })

  test('constraints disable navigation buttons', () => {
    const $ = (global as any).jQuery
    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10)
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
    )
      .toISOString()
      .slice(0, 10)
    $('#cal3').clndr({
      constraints: { startDate: start, endDate: end },
      render: (data: any) => `
        <div class="clndr-controls">
          <div class="clndr-previous-button"></div>
          <div class="clndr-next-button"></div>
        </div>
      `
    })

    const prev = document.querySelector('.clndr-previous-button') as HTMLElement
    const next = document.querySelector('.clndr-next-button') as HTMLElement
    expect(prev.className).toMatch(/inactive/)
    expect(next.className).toMatch(/inactive/)
  })
})
