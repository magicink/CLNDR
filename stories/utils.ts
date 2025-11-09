import { clndr } from '../src/ts'
import type { StoryContext } from '@storybook/html'

export function createContainer(width = 640): HTMLElement {
  const el = document.createElement('div')
  el.style.maxWidth = `${width}px`
  el.style.margin = '1rem auto'
  return el
}

export function mount(el: HTMLElement, options: any): any {
  return clndr(el, options)
}

// Utility to pipe CLNDR clickEvents into Storybook Actions
export function withActions(clickEvents: any, ctx: StoryContext): any {
  const actionsApi = (ctx as any).parameters?.actions
  if (!clickEvents || !actionsApi) return clickEvents
  // No-op for now; specific stories can wire actions explicitly.
  return clickEvents
}
