import $ from 'jquery'

import { clndr as createClndr } from './facade'

declare global {
  interface JQuery {
    clndr(options?: ClndrOptions): Clndr
  }
}

export function registerJQueryPlugin(): void {
  if (!$.fn) return

  $.fn.clndr = function (this: JQuery, options?: ClndrOptions): Clndr {
    if (this.length === 0) {
      throw new Error('CLNDR: No element selected for jQuery plugin.')
    }
    if (this.length > 1) {
      throw new Error(
        'CLNDR: Please initialize one calendar per jQuery collection.'
      )
    }

    return createClndr(this[0], options)
  }
}

if (typeof window !== 'undefined' && (window as any).jQuery) {
  registerJQueryPlugin()
}
