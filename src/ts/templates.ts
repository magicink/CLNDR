import { DateAdapter } from './date-adapter/adapter'

/**
 * Function that takes CLNDR template data and returns HTML.
 * Consumers may supply their own renderers; this is the minimal type.
 */
export type TemplateRenderer = (data: any) => string

/**
 * Default CLNDR template borrowed from the legacy plugin. This keeps parity
 * for consumers that relied on the built-in markup. Updated for basic a11y:
 * - Real buttons for navigation + today
 * - Live month heading
 * - Days rendered as buttons with ARIA states
 */
export const DEFAULT_TEMPLATE = `
<div class="clndr-controls" role="toolbar">
  <button class="clndr-previous-year-button" type="button" aria-label="Previous year">&laquo;</button>
  <button class="clndr-previous-button" type="button" aria-label="Previous month">&lsaquo;</button>
  <h2 class="month" aria-live="polite"><%= month %> <%= year %></h2>
  <button class="clndr-next-button" type="button" aria-label="Next month">&rsaquo;</button>
  <button class="clndr-next-year-button" type="button" aria-label="Next year">&raquo;</button>
  <button class="clndr-today-button" type="button" aria-label="Go to today">Today</button>
</div>
<div class="clndr-grid">
  <div class="days-of-the-week">
    <% for (var i = 0; i < daysOfTheWeek.length; i++) { %>
      <div class="header-day"><%= daysOfTheWeek[i] %></div>
    <% } %>
    <div class="days">
      <% for (var di = 0; di < days.length; di++) { var day = days[di]; %>
        <button
          type="button"
          class="<%= day.classes %>"
          <% if (day && day.date && day.date.toISO) { %> data-date="<%= day.date.toISO().slice(0,10) %>" <% } %>
          <% if (day && day.properties && day.properties.isInactive) { %> disabled aria-disabled="true" <% } %>
          <% if (day && day.properties && day.properties.isToday) { %> aria-current="date" <% } %>
          aria-label="<% if (day && day.date && day.date.toISO) { %><%= day.date.toISO().slice(0,10) %><% } else { %><%= day.day %><% } %>"
        ><%= day.day %></button>
      <% } %>
    </div>
  </div>
</div>
`.trim()

/**
 * Very small, naive template compiler for internal tests/examples.
 * Supports replacing `<%= key %>` with stringified values from `data`.
 * Nested property access via dot notation is supported (e.g., `a.b.c`).
 */
export function compile(template: string): TemplateRenderer {
  const re = /<%=\s*([\w.]+)\s*%>/g
  return (data: any) =>
    template.replace(re, (_m, key) => {
      const parts = String(key).split('.')
      let cur: any = data
      for (const p of parts) cur = cur?.[p]
      return cur == null ? '' : String(cur)
    })
}

/**
 * Construct a minimal CLNDR template data object with defaults for fields
 * that are expected by the stock template. Callers should then fill in
 * `days`, `month`, `year`, etc.
 */
export function baseTemplateData(
  adapter: DateAdapter,
  options: ClndrOptions
): ClndrTemplateData {
  return {
    daysOfTheWeek: options.daysOfTheWeek || adapter.weekdayLabels('short'),
    extras: options.extras,
    days: [],
    month: null,
    year: null,
    eventsThisMonth: [],
    eventsLastMonth: [],
    eventsNextMonth: [],
    months: [],
    numberOfRows: 0,
    intervalStart: null,
    intervalEnd: null,
    eventsThisInterval: null
  }
}

/**
 * Resolve the renderer function for a given CLNDR options object.
 * Priority:
 * 1) User-provided `render` callback.
 * 2) Provided `template` compiled via Underscore/Lodash `_.template` when available.
 * 3) Provided `template` compiled via the internal minimal compiler.
 * 4) Built-in default template compiled via the internal compiler.
 */
export function createRenderer(options: ClndrOptions): TemplateRenderer {
  if (typeof options.render === 'function') {
    return options.render
  }

  if (typeof options.template === 'string') {
    const underscore = (globalThis as any)?._
    if (underscore && typeof underscore.template === 'function') {
      return underscore.template(options.template)
    }
    return compile(options.template)
  }

  // Fall back to the built-in template. If Underscore is present, prefer
  // its full-featured template compiler so control-flow tags work as
  // expected; otherwise, use the minimal internal compiler.
  const underscore = (globalThis as any)?._
  if (underscore && typeof underscore.template === 'function') {
    return underscore.template(DEFAULT_TEMPLATE)
  }
  return compile(DEFAULT_TEMPLATE)
}

/**
 * Modern Grid Interval template (e.g., 14 days with a 7-day interval).
 */
export const GRID_INTERVAL_TEMPLATE = `
<div class="clndr-controls" role="toolbar">
  <button class="clndr-previous-button" type="button" aria-label="Previous interval">&lsaquo;</button>
  <div class="month" aria-live="polite"><%= intervalStart.format('M/DD') + ' &mdash; ' + intervalEnd.format('M/DD') %></div>
  <button class="clndr-next-button" type="button" aria-label="Next interval">&rsaquo;</button>
  <button class="clndr-today-button" type="button" aria-label="Go to today">Today</button>
</div>
<div class="clndr-grid">
  <div class="days-of-the-week">
    <% for (var i = 0; i < daysOfTheWeek.length; i++) { %>
      <div class="header-day"><%= daysOfTheWeek[i] %></div>
    <% } %>
    <div class="days">
      <% for (var di = 0; di < days.length; di++) { var day = days[di]; %>
        <button
          type="button"
          class="<%= day.classes %>"
          <% if (day && day.date && day.date.toISO) { %> data-date="<%= day.date.toISO().slice(0,10) %>" <% } %>
          <% if (day && day.properties && day.properties.isInactive) { %> disabled aria-disabled="true" <% } %>
          <% if (day && day.properties && day.properties.isToday) { %> aria-current="date" <% } %>
          aria-label="<% if (day && day.date && day.date.toISO) { %><%= day.date.toISO().slice(0,10) %><% } else { %><%= day.day %><% } %>"
        ><%= day.day %></button>
      <% } %>
    </div>
  </div>
</div>
`.trim()

/**
 * Modern Months Interval template: arrows + month titles in a single header
 * and side-by-side month grids.
 */
export const MONTHS_INTERVAL_TEMPLATE_MODERN = `
<div class="clndr-controls months-header" role="toolbar">
  <button class="clndr-previous-button" type="button" aria-label="Previous interval">&lsaquo;</button>
  <div class="months-titles">
    <% for (var m = 0; m < months.length; m++) { var cal = months[m]; %>
      <div class="month"><%= cal.month.format('MMMM') %></div>
    <% } %>
  </div>
  <button class="clndr-next-button" type="button" aria-label="Next interval">&rsaquo;</button>
  </div>
<div class="months-body">
  <% for (var m = 0; m < months.length; m++) { var cal = months[m]; %>
    <div class="cal">
      <div class="clndr-grid">
        <div class="days-of-the-week">
          <% for (var i = 0; i < daysOfTheWeek.length; i++) { %>
            <div class="header-day"><%= daysOfTheWeek[i] %></div>
          <% } %>
          <div class="days">
            <% for (var di = 0; di < cal.days.length; di++) { var day = cal.days[di]; %>
              <button
                type="button"
                class="<%= day.classes %>"
                <% if (day && day.date && day.date.toISO) { %> data-date="<%= day.date.toISO().slice(0,10) %>" <% } %>
                <% if (day && day.properties && day.properties.isInactive) { %> disabled aria-disabled="true" <% } %>
                <% if (day && day.properties && day.properties.isToday) { %> aria-current="date" <% } %>
                aria-label="<% if (day && day.date && day.date.toISO) { %><%= day.date.toISO().slice(0,10) %><% } else { %><%= day.day %><% } %>"
              ><%= day.day %></button>
            <% } %>
            <% /* Enforce six rows of 7 days (42 cells) regardless of options.forceSixRows */ %>
            <% var __total = 42; var __pad = __total - cal.days.length; if (__pad > 0) { %>
              <% for (var __i = 0; __i < __pad; __i++) { %>
                <div class="empty"></div>
              <% } %>
            <% } %>
          </div>
        </div>
      </div>
    </div>
  <% } %>
</div>
<button class="clndr-today-button" type="button" aria-label="Go to today">Today</button>
`.trim()
