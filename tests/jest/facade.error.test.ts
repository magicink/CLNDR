describe('TS facade: error path when plugin missing', () => {
  test('throws if $.fn.clndr is not registered', async () => {
    const $: any = (global as any).jQuery
    const saved = $.fn.clndr
    try {
      delete $.fn.clndr
      const mod = await import('../../src/ts/index')
      expect(() => mod.clndr('#missing')).toThrow(
        /jQuery with clndr plugin is required/
      )
    } finally {
      $.fn.clndr = saved
    }
  })
})
