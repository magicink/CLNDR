import type { Meta, StoryObj } from '@storybook/html'
import { clndr, GRID_INTERVAL_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'
import { DateTime } from 'luxon'

const meta: Meta = {
  title: 'CLNDR/Intervals (Days)',
  render: (args: any) => {
    const el = createContainer(600)
    ;(el as any).__api = clndr(el, {
      applyThemeClasses: true,
      theme: 'modern',
      ...args,
      template: GRID_INTERVAL_TEMPLATE
    })
    return el
  },
  argTypes: {},
  args: {
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: false,
    lengthOfTime: {
      days: 14,
      interval: 7,
      startDate: DateTime.now().set({ weekday: 7 }).toISODate()
    }
  }
}

export default meta

const now = DateTime.now()

export const TwoWeeks: StoryObj = {}

export const TwoWeeksWithConstraints: StoryObj = {
  args: {
    // reuse multi-day events like the month view examples
    events: [
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
    ],
    multiDayEvents: { startDate: 'startDate', endDate: 'endDate' },
    constraints: {
      startDate: now.toFormat('yyyy-LL') + '-04',
      endDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-12'
    }
  }
}

export const TwoWeeksPrevMonthConstraints: StoryObj = {
  args: {
    constraints: {
      startDate: now.minus({ months: 1 }).toFormat('yyyy-LL') + '-02',
      endDate: now.minus({ months: 1 }).toFormat('yyyy-LL') + '-05'
    }
  }
}

export const TwoWeeksNextMonthConstraints: StoryObj = {
  args: {
    constraints: {
      startDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-22',
      endDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-25'
    }
  }
}

export const WeekOffset: StoryObj = {
  args: {
    weekOffset: 5,
    lengthOfTime: {
      days: 28,
      interval: 28,
      startDate: DateTime.now().set({ weekday: 5 }).toISODate()
    }
  }
}

export const WeekOffsetInvalid: StoryObj = {
  args: {
    weekOffset: 7,
    lengthOfTime: {
      days: 28,
      interval: 28,
      startDate: DateTime.now().set({ weekday: 5 }).toISODate()
    }
  }
}
