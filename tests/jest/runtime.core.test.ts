import { clndr } from '../../src/ts/index'

describe('TypeScript runtime factory', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="ts-cal"></div>'
  })

  test('creates a calendar without relying on the jQuery plugin', () => {
    const api = clndr('#ts-cal', {
      render: () => `<div class="clndr-body"></div>`
    })
    expect(api).toBeTruthy()
    expect(document.querySelector('#ts-cal .clndr')).toBeTruthy()
  })

  test('auto-registers the jQuery plugin wrapper', () => {
    const $ = (global as any).jQuery
    const api = $('#ts-cal').clndr({
      render: () => `<div class="clndr-body"></div>`
    })
    expect(typeof api.render).toBe('function')
    expect(document.querySelector('#ts-cal .clndr')).toBeTruthy()
  })
})
