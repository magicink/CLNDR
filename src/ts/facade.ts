/**
 * TypeScript facade for CLNDR's legacy jQuery plugin.
 * Exposes a typed factory that delegates to $.fn.clndr at runtime.
 */

// This facade works with the legacy plugin (src/clndr.js) and delegates to
// $.fn.clndr using the jQuery module instance.
import $ from 'jquery'

// Factory: create a CLNDR instance from a selector/element/jQuery collection.
export function clndr(element: any, options?: ClndrOptions): Clndr {
  if (typeof ($ as any).fn?.clndr !== 'function') {
    throw new Error('CLNDR: jQuery with clndr plugin is required at runtime')
  }
  const $el: any = element && element.jquery ? element : ($ as any)(element)
  // Defer to the legacy plugin; it will throw if zero/multiple elements.
  return $el.clndr(options)
}
