import { compile, renderWithTemplate } from '../../src/ts/index'

describe('render helpers', () => {
  test('renderWithTemplate produces HTML string', () => {
    const tpl = compile('<div class="greet">Hi, <%= name %></div>')
    const out = renderWithTemplate(tpl, { name: 'Ada' })
    expect(out.html).toBe('<div class="greet">Hi, Ada</div>')
  })
})
