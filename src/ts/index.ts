/**
 * Entry for TypeScript consumers. Re-export the modern facade plus
 * supporting utilities for adapter customization and template helpers.
 */
export { clndr } from './facade'
export { ClndrCore } from './core'
export { ClndrDOM } from './dom'

export * from './date-adapter/adapter'
export {
  createLuxonAdapter,
  LuxonDateAdapter
} from './date-adapter/luxon-adapter'
export { normalizeOptions } from './config'
export { initState } from './state'
export * from './templates'
export * from './render'
export { registerJQueryPlugin } from './jquery-plugin'

// Auto-register the jQuery plugin when jQuery is present in the environment.
import './jquery-plugin'
