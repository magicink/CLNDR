/**
 * Localization-focused tests for CLNDR (Luxon-only).
 * Validates weekday headers, weekOffset interaction, and month names
 * across different locales.
 */

import { createLuxonAdapter } from '../../src/ts/index'
import { Info } from 'luxon'

function ddFromLuxon(dt: any, locale: string): string {
  try {
    const idx = dt && typeof dt.weekday === 'number' ? dt.weekday - 1 : 0 // 1..7 -> 0..6
    const labels = Info.weekdays('short', { locale })
    const label = labels[idx] || ''
    return String(label).slice(0, 2)
  } catch {
    return ''
  }
}

describe('CLNDR localization: weekday headers', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cal-loc"></div>'
  })

  afterEach(() => {})

  test('uses locale for weekday headers (en)', () => {
    const $ = (global as any).jQuery

    const adapter = createLuxonAdapter('en')
    const start = adapter.now().startOf('week')
    const expected = Array.from({ length: 7 }, (_, i) =>
      adapter.setWeekday(start, i).format('dd')
    )

    $('#cal-loc').clndr({
      locale: 'en',
      // Ensure CLNDR uses adapter-format based labels (not single char)
      formatWeekdayHeader: (d: any) => ddFromLuxon(d, 'en'),
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

  test('uses locale for weekday headers (fr)', () => {
    const $ = (global as any).jQuery

    const adapter = createLuxonAdapter('fr')
    const start = adapter.now().startOf('week')
    const expected = Array.from({ length: 7 }, (_, i) =>
      adapter.setWeekday(start, i).format('dd')
    )

    $('#cal-loc').clndr({
      locale: 'fr',
      formatWeekdayHeader: (d: any) => ddFromLuxon(d, 'fr'),
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
    const enAdapter = createLuxonAdapter('en')
    const enStart = enAdapter.now().startOf('week')
    const enExpected = Array.from({ length: 7 }, (_, i) =>
      enAdapter.setWeekday(enStart, i).format('dd')
    )
    expect(labels).not.toEqual(enExpected)
  })

  test('uses locale for weekday headers (de)', () => {
    const $ = (global as any).jQuery

    const adapter = createLuxonAdapter('de')
    const start = adapter.now().startOf('week')
    const expected = Array.from({ length: 7 }, (_, i) =>
      adapter.setWeekday(start, i).format('dd')
    )

    $('#cal-loc').clndr({
      locale: 'de',
      formatWeekdayHeader: (d: any) => ddFromLuxon(d, 'de'),
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
  })

  test('applies weekOffset rotation with locale headers', () => {
    const $ = (global as any).jQuery
    const adapter = createLuxonAdapter('fr')
    const start = adapter.now().startOf('week')
    const base = Array.from({ length: 7 }, (_, i) =>
      adapter.setWeekday(start, i).format('dd')
    )
    const rotated = [...base.slice(1), ...base.slice(0, 1)]

    $('#cal-loc-wo').clndr({
      locale: 'fr',
      weekOffset: 1,
      formatWeekdayHeader: (d: any) => ddFromLuxon(d, 'fr'),
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
  })

  test('renders localized month name (startWithMonth)', () => {
    const $ = (global as any).jQuery
    const adapter = createLuxonAdapter('fr')
    const startISO = '2020-05-01'
    const expectedMonth = adapter.fromISO(startISO).format('MMMM')
    const expectedYear = adapter.fromISO(startISO).format('YYYY')

    $('#cal-loc-month').clndr({
      locale: 'fr',
      startWithMonth: startISO,
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
    const adapter = createLuxonAdapter('de')
    const start = adapter.now().startOf('week')
    const localeLabels = Array.from({ length: 7 }, (_, i) =>
      adapter.setWeekday(start, i).format('dd')
    )
    expect(labels).not.toEqual(localeLabels)
  })
})
