import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'
import { DateTime } from 'luxon'

const meta: Meta = {
  title: 'CLNDR/Classes',
  render: (args: any) => {
    const el = createContainer(600)
    ;(el as any).__api = clndr(el, {
      ...args,
      template: DEFAULT_TEMPLATE
    })
    return el
  },
  argTypes: {
    applyThemeClasses: { control: false },
    theme: { control: false }
  },
  args: {
    applyThemeClasses: true,
    theme: 'modern',
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: false
  }
}

export default meta

const now = DateTime.now()

export const CustomClasses: StoryObj = {
  args: {
    events: [
      { title: 'Event 1', date: now.set({ day: 7 }).toFormat('yyyy-LL-dd') },
      { title: 'Event 2', date: now.set({ day: 23 }).toFormat('yyyy-LL-dd') }
    ],
    classes: {
      past: 'my-past',
      today: 'my-today',
      event: 'my-event',
      inactive: 'my-inactive',
      lastMonth: 'my-last-month',
      nextMonth: 'my-next-month',
      adjacentMonth: 'my-adjacent-month'
    },
    clickEvents: {
      click: (t: any) => console.log('click', t)
    }
  }
}
