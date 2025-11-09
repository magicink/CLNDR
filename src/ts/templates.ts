import { DateAdapter } from './date-adapter/adapter'

/**
 * Function that takes CLNDR template data and returns HTML.
 * Consumers may supply their own renderers; this is the minimal type.
 */
export type TemplateRenderer = (data: any) => string

/**
 * Default CLNDR template borrowed from the legacy plugin. This keeps parity
 * for consumers that relied on the built-in markup.
 */
export const DEFAULT_TEMPLATE = `\n<div class="clndr-controls">
  <div class="clndr-previous-button">&lsaquo;</div>
  <div class="month"><%= month %> <%= year %></div>
  <div class="clndr-next-button">&rsaquo;</div>
</div>
<div class="clndr-grid">
  <div class="days-of-the-week">
    <% for (var i = 0; i < daysOfTheWeek.length; i++) { %>
      <div class="header-day"><%= daysOfTheWeek[i] %></div>
    <% } %>
    <div class="days">
      <% for (var di = 0; di < days.length; di++) { var day = days[di]; %>
        <div class="<%= day.classes %>"><%= day.day %></div>
      <% } %>
    </div>
  </div>
</div>
<div class="clndr-today-button">Today</div>\n`.trim()

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
