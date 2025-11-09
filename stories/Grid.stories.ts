import type { Meta, StoryObj } from '@storybook/html'
import { clndr, GRID_INTERVAL_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'

// Use exported modern Grid Interval template from the package

const meta: Meta = {
  title: 'CLNDR/Grid Interval',
  render: (args: any) => {
    const el = createContainer(600)
    // Apply legacy wrapper only for legacy themes
    if (args.theme !== 'modern') {
      el.classList.add('cal2')
    }
    // Align Modern Grid color scheme with Basic Modern (table-mode palette)
    ;(el as any).__api = clndr(el, {
      ...args,
      template: GRID_INTERVAL_TEMPLATE
    })
    // Use standard modern palette without JS overrides
    return el
  },
  argTypes: {
    applyThemeClasses: { control: false },
    theme: { control: false }
  },
  args: {
    weekOffset: 0,
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: false,
    lengthOfTime: { days: 14, interval: 7 },
    applyThemeClasses: true,
    theme: 'grid'
  }
}

export default meta
export const Default: StoryObj = {}
export const Modern: StoryObj = { args: { theme: 'modern' } }
