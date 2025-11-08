import type { DateAdapter } from './date-adapter/adapter'
import { createLuxonAdapter } from './date-adapter/luxon-adapter'
import { ClndrCore, type StateChange } from './core'
import { ClndrDOM } from './dom'
import { normalizeOptions } from './config'
import { createRenderer } from './templates'

/**
 * Primary CLNDR factory. Creates a fully TypeScript-backed calendar instance
 * that renders via the DOM integration layer and exposes the familiar API.
 */
export function clndr(
  element: HTMLElement | JQuery | string,
  userOptions: ClndrOptions = {}
): Clndr {
  const adapter = selectAdapter(userOptions)
  const normalized = normalizeOptions(adapter, userOptions)
  normalized.options.daysOfTheWeek =
    normalized.options.daysOfTheWeek || normalized.daysOfTheWeek

  const core = new ClndrCore(adapter, normalized.options)
  const renderer = createRenderer(normalized.options)
  const dom = new ClndrDOM(element, core, renderer, adapter)
  const api = createPublicApi(core, dom)

  dom.attachApi(api)
  dom.render()

  if (typeof normalized.options.ready === 'function') {
    normalized.options.ready.apply(api, [])
  }

  return api
}

function selectAdapter(options: ClndrOptions): DateAdapter<any> {
  if (options.dateAdapter) return options.dateAdapter

  if (options.dateLibrary && options.dateLibrary !== 'luxon') {
    throw new Error(
      'CLNDR: Moment support has been removed. Use the default Luxon adapter or provide a custom dateAdapter.'
    )
  }

  return createLuxonAdapter(options.locale, options.zone)
}

function createPublicApi(core: ClndrCore<any>, dom: ClndrDOM<any>): Clndr {
  const options = core.getOptions()

  const applyNav = (
    change: StateChange | null,
    opts: { action?: 'today'; withCallbacks?: boolean } = {}
  ) => {
    if (!change) return
    dom.applyChange(change, {
      action: opts.action,
      fireCallbacks: opts.withCallbacks === true
    })
  }

  const api: Clndr = {
    options,
    element: dom.element[0],

    render() {
      dom.render()
      return this
    },

    forward(opts) {
      applyNav(core.forward(), { withCallbacks: opts?.withCallbacks })
      return this
    },

    next(opts) {
      return this.forward(opts)
    },

    back(opts) {
      applyNav(core.back(), { withCallbacks: opts?.withCallbacks })
      return this
    },

    previous(opts) {
      return this.back(opts)
    },

    nextYear(opts) {
      applyNav(core.nextYear(), { withCallbacks: opts?.withCallbacks })
      return this
    },

    previousYear(opts) {
      applyNav(core.previousYear(), { withCallbacks: opts?.withCallbacks })
      return this
    },

    today(opts) {
      applyNav(core.today(), {
        action: 'today',
        withCallbacks: opts?.withCallbacks
      })
    },

    setMonth(newMonth, opts) {
      applyNav(core.setMonth(newMonth), { withCallbacks: opts?.withCallbacks })
      return this
    },

    setYear(newYear, opts) {
      applyNav(core.setYear(newYear), { withCallbacks: opts?.withCallbacks })
      return this
    },

    setExtras(extras) {
      core.setExtras(extras)
      dom.render()
      return this
    },

    setEvents(events) {
      core.setEvents(events)
      dom.render()
      return this
    },

    addEvents(events, reRender = true) {
      core.addEvents(events)
      if (reRender !== false) {
        dom.render()
      }
      return this
    },

    removeEvents(match) {
      core.removeEvents(match)
      dom.render()
      return this
    },

    destroy() {
      dom.destroy()
    }
  }

  return api
}
