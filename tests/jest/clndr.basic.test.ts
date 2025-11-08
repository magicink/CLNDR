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
    const clndr = (await import('../../src/ts/index')).default
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
