import type { Meta, StoryObj } from '@storybook/html'
import { clndr, MONTHS_INTERVAL_TEMPLATE_MODERN } from '../src/ts'
import { createContainer } from './utils'
import { DateTime } from 'luxon'

// Modern markup template imported from package

const meta: Meta = {
  title: 'CLNDR/Months Interval',
  render: (args: any) => {
    const el = createContainer(800)
    // Align Modern Months color scheme with Basic Modern (table-mode palette)
    ;(el as any).__api = clndr(el, {
      applyThemeClasses: true,
      theme: 'modern',
      ...args,
      template: MONTHS_INTERVAL_TEMPLATE_MODERN
    })
    // Use standard modern palette without JS overrides
    return el
  },
  argTypes: {},
  args: {
    weekOffset: 0,
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: false,
    lengthOfTime: { months: 2, interval: 1 }
  }
}

export default meta
export const Default: StoryObj = {}

// Modern-only variants mirroring tests: three months, with events, constraints
const now = DateTime.now()

export const ModernThreeMonths: StoryObj = {
  name: 'Three Months (Modern)',
  args: {
    lengthOfTime: {
      months: 3,
      interval: 1,
      startDate: now.minus({ months: 1 }).startOf('month').toISODate()
    },
    clickEvents: {
      previousInterval: (start: any, end: any) =>
        console.log('previous interval:', start, end),
      nextInterval: (start: any, end: any) =>
        console.log('next interval:', start, end),
      onIntervalChange: (start: any, end: any) =>
        console.log('interval change:', start, end)
    }
  }
}

export const ModernThreeMonthsWithEvents: StoryObj = {
  name: 'Three Months + Events (Modern)',
  args: {
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
    lengthOfTime: {
      months: 3,
      interval: 1,
      startDate: now.minus({ months: 1 }).startOf('month').toISODate()
    },
    clickEvents: {
      previousInterval: (start: any, end: any) =>
        console.log('previous interval:', start, end),
      nextInterval: (start: any, end: any) =>
        console.log('next interval:', start, end),
      onIntervalChange: (start: any, end: any) =>
        console.log('interval change:', start, end)
    }
  }
}

export const ModernThreeMonthsWithConstraints: StoryObj = {
  name: 'Three Months + Constraints (Modern)',
  args: {
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
      startDate: now.minus({ months: 2 }).toISODate(),
      endDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-12'
    },
    lengthOfTime: {
      months: 3,
      interval: 1,
      startDate: now.minus({ months: 1 }).startOf('month').toISODate()
    },
    clickEvents: {
      previousInterval: (start: any, end: any) =>
        console.log('previous interval:', start, end),
      nextInterval: (start: any, end: any) =>
        console.log('next interval:', start, end),
      onIntervalChange: (start: any, end: any) =>
        console.log('interval change:', start, end)
    }
  }
}
