import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'

const meta: Meta = {
  title: 'CLNDR/Callbacks',
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
  argTypes: {},
  args: {
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: false
  }
}

export default meta

export const CallbackLogging: StoryObj = {
  args: {
    ready: () => console.log('ready()'),
    clickEvents: {
      click: (t: any) => console.log('click', t),
      today: (m: any) => console.log('today', m),
      nextYear: (m: any) => console.log('next year', m),
      nextMonth: (m: any) => console.log('next month', m),
      previousYear: (m: any) => console.log('previous year', m),
      onYearChange: (m: any) => console.log('on year change', m),
      previousMonth: (m: any) => console.log('previous month', m),
      onMonthChange: (m: any) => console.log('on month change', m)
    },
    doneRendering: () => console.log('doneRendering()')
  }
}
