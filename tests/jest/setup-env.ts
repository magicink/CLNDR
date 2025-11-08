// jsdom test setup for CLNDR
import 'jest-environment-jsdom'

// Ensure jQuery is available globally and register the plugin
// The jquery package attaches to the jsdom window automatically in this env.
const $: any = require('jquery')
;(global as any).$ = $
;(global as any).jQuery = $

// Register the TS runtime + jQuery plugin
require('../../src/ts/index')

// Default DATE_LIB to 'moment' if unset; infra for future adapter tests
process.env.DATE_LIB = process.env.DATE_LIB || 'moment'
