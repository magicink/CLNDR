import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'

const meta: Meta = {
  title: 'CLNDR/Basic',
  render: (args: any) => {
    const el = createContainer(600)
    // Apply cal1 wrapper so default table CSS rules apply
    el.classList.add('cal1')
    const api = clndr(el, {
      ...args,
      template: DEFAULT_TEMPLATE
    })
    ;(el as any).__api = api
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
    adjacentDaysChangeMonth: false,
    applyThemeClasses: true,
    theme: 'default'
  }
}

export default meta
export const Default: StoryObj = {}
