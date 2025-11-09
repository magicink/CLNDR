import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'

const meta: Meta = {
  title: 'CLNDR/Basic',
  render: (args: any) => {
    const el = createContainer(600)
    ;(el as any).__api = clndr(el, {
      applyThemeClasses: true,
      theme: 'modern',
      ...args,
      template: DEFAULT_TEMPLATE
    })
    return el
  },
  argTypes: {
    weekOffset: { control: 'number' },
    showAdjacentMonths: { control: 'boolean' },
    adjacentDaysChangeMonth: { control: 'boolean' }
  },
  args: {
    weekOffset: 0,
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: false
  }
}

export default meta
export const Default: StoryObj = {}
