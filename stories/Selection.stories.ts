import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'
import { DateTime } from 'luxon'

const meta: Meta = {
  title: 'CLNDR/Selection',
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

const now = DateTime.now()

export const SelectedDate: StoryObj = {
  args: {
    trackSelectedDate: true
  }
}

export const SelectedDateIgnoreInactive: StoryObj = {
  args: {
    trackSelectedDate: true,
    ignoreInactiveDaysInSelection: true,
    constraints: {
      startDate: now.minus({ months: 1 }).toISODate(),
      endDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-12'
    }
  }
}

export const SelectedDateAdjacentDays: StoryObj = {
  args: {
    trackSelectedDate: true,
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: true
  }
}

export const FormatWeekdayHeader: StoryObj = {
  args: {
    formatWeekdayHeader: (day: any) =>
      day && typeof day.toFormat === 'function' ? day.toFormat('cccc') : ''
  }
}
