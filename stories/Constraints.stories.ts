import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'
import { DateTime } from 'luxon'

const meta: Meta = {
  title: 'CLNDR/Constraints',
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

export const RangeCurrentToNext: StoryObj = {
  name: 'Range: This → Next Month',
  args: {
    constraints: {
      startDate: now.toFormat('yyyy-LL') + '-04',
      endDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-12'
    }
  }
}

export const PrevNextMonthWindow: StoryObj = {
  name: 'Range: Prev(22) → Next(05)',
  args: {
    constraints: {
      startDate: now.minus({ months: 1 }).toFormat('yyyy-LL') + '-22',
      endDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-05'
    }
  }
}

export const PrevMonthWindow: StoryObj = {
  name: 'Prev Month: 2 → 5',
  args: {
    constraints: {
      startDate: now.minus({ months: 1 }).toFormat('yyyy-LL') + '-02',
      endDate: now.minus({ months: 1 }).toFormat('yyyy-LL') + '-05'
    }
  }
}

export const NextMonthWindow: StoryObj = {
  name: 'Next Month: 22 → 25',
  args: {
    constraints: {
      startDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-22',
      endDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-25'
    }
  }
}

export const StartOnly: StoryObj = {
  name: 'Start Constraint Only',
  args: {
    constraints: {
      startDate: now.toFormat('yyyy-LL') + '-04'
    }
  }
}

export const EndOnly: StoryObj = {
  name: 'End Constraint Only',
  args: {
    constraints: {
      endDate: now.plus({ months: 1 }).toFormat('yyyy-LL') + '-12'
    }
  }
}

export const ForceSixRows: StoryObj = {
  name: 'Force Six Rows',
  args: {
    forceSixRows: true
  }
}
