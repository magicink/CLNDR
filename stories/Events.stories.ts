import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'
import { DateTime } from 'luxon'

const meta: Meta = {
  title: 'CLNDR/Events',
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

function multiDayPair() {
  return [
    {
      title: 'Multi1',
      startDate: now.set({ day: 12 }).toFormat('yyyy-LL-dd'),
      endDate: now.set({ day: 17 }).toFormat('yyyy-LL-dd')
    },
    {
      title: 'Multi2',
      startDate: now.set({ day: 24 }).toFormat('yyyy-LL-dd'),
      endDate: now.set({ day: 27 }).toFormat('yyyy-LL-dd')
    }
  ]
}

export const MultiDay: StoryObj = {
  args: {
    events: multiDayPair(),
    multiDayEvents: { startDate: 'startDate', endDate: 'endDate' },
    clickEvents: {
      click: (t: any) => console.log('click', t)
    }
  }
}

export const MultiDayMixed: StoryObj = {
  args: {
    events: [
      ...multiDayPair(),
      { title: 'Single', date: now.set({ day: 19 }).toFormat('yyyy-LL-dd') }
    ],
    multiDayEvents: {
      startDate: 'startDate',
      endDate: 'endDate',
      singleDay: 'date'
    },
    clickEvents: {
      click: (t: any) => console.log('click', t)
    }
  }
}

export const MultiDayLong: StoryObj = {
  args: {
    events: [
      {
        title: 'Multi1',
        startDate: now.minus({ months: 3 }).toFormat('yyyy-LL') + '-12',
        endDate: now.set({ day: 17 }).toFormat('yyyy-LL-dd')
      },
      {
        title: 'Multi2',
        startDate: now.set({ day: 24 }).toFormat('yyyy-LL-dd'),
        endDate: now.plus({ months: 4 }).toFormat('yyyy-LL') + '-27'
      }
    ],
    multiDayEvents: { startDate: 'startDate', endDate: 'endDate' },
    clickEvents: {
      click: (t: any) => console.log('click', t)
    }
  }
}
