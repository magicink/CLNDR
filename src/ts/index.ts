/**
 * Entry for TypeScript consumers. Re-export the facade that delegates
 * to the legacy jQuery plugin, using named exports for tree-shaking.
 */

export { clndr } from './facade'

// Phase 5: expose adapter interface and helpers for modular core
export * from './date-adapter/adapter'
export {
  createMomentAdapter,
  MomentDateAdapter
} from './date-adapter/moment-adapter'
export {
  createLuxonAdapter,
  LuxonDateAdapter
} from './date-adapter/luxon-adapter'
export { normalizeOptions } from './config'
export { initState } from './state'
export * from './templates'
export * from './render'
