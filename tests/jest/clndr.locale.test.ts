/**
 * Localization-focused tests for CLNDR.
 * Validates weekday headers, weekOffset interaction, and month names
 * across different moment locales.
 */

import moment from 'moment'
import 'moment/locale/fr'
import 'moment/locale/de'

// Cross-adapter weekday formatter used in tests: accepts either a Moment
// instance or a Luxon DateTime (from the TS adapter path) and returns
// a two-letter weekday label consistent with Moment's `dd` token.
function fmtWeekdayHeader(d: any): string {
  if (d && typeof d.format === 'function') return d.format('dd')
  if (d && typeof d.toISO === 'function') {
    const m = require('moment')
    return m(d.toISO()).format('dd')
  }
  return ''
}

describe('CLNDR localization: weekday headers', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cal-loc"></div>'
    moment.locale('en')
  })

  afterEach(() => {
    moment.locale('en')
  })

  test('uses moment locale for weekday headers (en)', () => {
    const $ = (global as any).jQuery

    // Expected labels from moment for current locale
    const expected = Array.from({ length: 7 }, (_, i) =>
      moment().weekday(i).format('dd')
    )

    $('#cal-loc').clndr({
      // Ensure CLNDR uses moment-format based labels (not single char)
      formatWeekdayHeader: (d: any) => fmtWeekdayHeader(d),
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

    const labels = Array.from(
      document.querySelectorAll('.header-day'),
      n => n.textContent?.trim() || ''
    )

    expect(labels).toEqual(expected)
  })

  test('uses moment locale for weekday headers (fr)', () => {
    moment.locale('fr')
    const $ = (global as any).jQuery

    const expected = Array.from({ length: 7 }, (_, i) =>
      moment().weekday(i).format('dd')
    )

    $('#cal-loc').clndr({
      formatWeekdayHeader: (d: any) => fmtWeekdayHeader(d),
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

    const labels = Array.from(
      document.querySelectorAll('.header-day'),
      n => n.textContent?.trim() || ''
    )

    expect(labels).toEqual(expected)

    // Sanity: ensure locale actually changed something vs EN for this run
    moment.locale('en')
    const enExpected = Array.from({ length: 7 }, (_, i) =>
      moment().weekday(i).format('dd')
    )
    expect(labels).not.toEqual(enExpected)
  })

  test('uses moment locale for weekday headers (de)', () => {
    moment.locale('de')
    const $ = (global as any).jQuery

    const expected = Array.from({ length: 7 }, (_, i) =>
      moment().weekday(i).format('dd')
    )

    $('#cal-loc').clndr({
      formatWeekdayHeader: (d: any) => fmtWeekdayHeader(d),
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

    const labels = Array.from(
      document.querySelectorAll('.header-day'),
      n => n.textContent?.trim() || ''
    )

    expect(labels).toEqual(expected)
  })
})

describe('CLNDR localization: weekOffset on localized labels', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cal-loc-wo"></div>'
    moment.locale('fr')
  })

  test('applies weekOffset rotation with locale headers', () => {
    const $ = (global as any).jQuery
    const base = Array.from({ length: 7 }, (_, i) =>
      moment().weekday(i).format('dd')
    )
    const rotated = [...base.slice(1), ...base.slice(0, 1)]

    $('#cal-loc-wo').clndr({
      weekOffset: 1,
      formatWeekdayHeader: (d: any) => fmtWeekdayHeader(d),
      render: (data: any) => {
        const headers = data.daysOfTheWeek
          .map((d: string) => `<span class="header-day">${d}</span>`) // assertion selector
          .join('')
        return `<div class="days-of-the-week">${headers}</div>`
      }
    })

    const labels = Array.from(
      document.querySelectorAll('.header-day'),
      n => n.textContent?.trim() || ''
    )
    expect(labels).toEqual(rotated)
  })
})

describe('CLNDR localization: month name by locale', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cal-loc-month"></div>'
    moment.locale('fr')
  })

  test('renders localized month name (startWithMonth)', () => {
    const $ = (global as any).jQuery
    const start = moment('2020-05-01') // May 2020
    const expectedMonth = start.clone().locale('fr').format('MMMM')
    const expectedYear = start.year()

    $('#cal-loc-month').clndr({
      startWithMonth: start,
      render: (data: any) =>
        `<div class="month-year">${data.month} ${data.year}</div>`
    })

    const text = (
      document.querySelector('.month-year')?.textContent || ''
    ).trim()
    expect(text).toBe(`${expectedMonth} ${expectedYear}`)
  })
})

describe('CLNDR localization: custom day labels override locale', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cal-loc-custom"></div>'
    moment.locale('de') // pick a non-en locale to ensure override works
  })

  test('uses provided daysOfTheWeek array instead of locale', () => {
    const $ = (global as any).jQuery
    const custom = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    $('#cal-loc-custom').clndr({
      daysOfTheWeek: custom,
      render: (data: any) => {
        const headers = data.daysOfTheWeek
          .map((d: string) => `<span class=header-day>${d}</span>`) // assertion selector
          .join('')
        return `<div class="days-of-the-week">${headers}</div>`
      }
    })

    const labels = Array.from(
      document.querySelectorAll('.header-day'),
      n => n.textContent?.trim() || ''
    )

    expect(labels).toEqual(custom)

    // And they should differ from the locale-driven defaults
    const localeLabels = Array.from({ length: 7 }, (_, i) =>
      moment().weekday(i).format('dd')
    )
    expect(labels).not.toEqual(localeLabels)
  })
})
