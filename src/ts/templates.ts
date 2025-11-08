import { DateAdapter } from './date-adapter/adapter'

/**
 * Function that takes CLNDR template data and returns HTML.
 * Consumers may supply their own renderers; this is the minimal type.
 */
export type TemplateRenderer = (data: any) => string

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
