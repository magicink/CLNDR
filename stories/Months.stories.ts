import type { Meta, StoryObj } from '@storybook/html'
import { clndr, MONTHS_INTERVAL_TEMPLATE_MODERN } from '../src/ts'
import { createContainer } from './utils'
import { DateTime } from 'luxon'

const MONTHS_TEMPLATE = `
<div class="clndr-controls top">
  <div class="clndr-previous-button">&lsaquo;</div>
  <div class="clndr-next-button">&rsaquo;</div>
</div>
<div class="clearfix">
  <% for (var m = 0; m < months.length; m++) { var cal = months[m]; %>
    <div class="cal">
      <div class="clndr-controls">
        <div class="month"><%= cal.month.format('MMMM') %></div>
      </div>
      <div class="clndr-grid">
        <div class="days-of-the-week">
          <% for (var i = 0; i < daysOfTheWeek.length; i++) { %>
            <div class="header-day"><%= daysOfTheWeek[i] %></div>
          <% } %>
          <div class="days">
            <% for (var di = 0; di < cal.days.length; di++) { var day = cal.days[di]; %>
              <div class="<%= day.classes %>"><%= day.day %></div>
            <% } %>
          </div>
        </div>
      </div>
    </div>
  <% } %>
</div>
<div class="clndr-today-button">Today</div>
`.trim()

// Modern markup template imported from package

const meta: Meta = {
  title: 'CLNDR/Months Interval',
  render: (args: any) => {
    const el = createContainer(800)
    // Apply legacy wrapper only for legacy themes
    if (args.theme !== 'modern') {
      el.classList.add('cal3')
    }
    // Align Modern Months color scheme with Basic Modern (table-mode palette)
    ;(el as any).__api = clndr(el, {
      ...args,
      template:
        args.theme === 'modern'
          ? MONTHS_INTERVAL_TEMPLATE_MODERN
          : MONTHS_TEMPLATE
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
    lengthOfTime: { months: 2, interval: 1 },
    applyThemeClasses: true,
    theme: 'modern'
  }
}

export default meta
export const Default: StoryObj = {}
export const Modern: StoryObj = { args: { theme: 'modern' } }

// Modern-only variants mirroring tests: three months, with events, constraints
const now = DateTime.now()

export const ModernThreeMonths: StoryObj = {
  name: 'Three Months (Modern)',
  args: {
    theme: 'modern',
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
    theme: 'modern',
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
    theme: 'modern',
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
