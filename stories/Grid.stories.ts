import type { Meta, StoryObj } from '@storybook/html'
import { clndr } from '../src/ts'
import { createContainer } from './utils'

const GRID_TEMPLATE = `
<div class="clndr-controls">
  <div class="clndr-previous-button">&lsaquo;</div>
  <div class="month"><%= intervalStart.format('M/DD') + ' &mdash; ' + intervalEnd.format('M/DD') %></div>
  <div class="clndr-next-button">&rsaquo;</div>
</div>
<div class="clndr-grid">
  <div class="days-of-the-week">
    <% for (var i = 0; i < daysOfTheWeek.length; i++) { %>
      <div class="header-day"><%= daysOfTheWeek[i] %></div>
    <% } %>
    <div class="days">
      <% for (var di = 0; di < days.length; di++) { var day = days[di]; %>
        <div class="<%= day.classes %>"><%= day.day %></div>
      <% } %>
    </div>
  </div>
</div>
<div class="clndr-today-button">Today</div>
`.trim()

const meta: Meta = {
  title: 'CLNDR/Grid Interval',
  render: (args: any) => {
    const el = createContainer(600)
    // Apply legacy wrapper only for legacy themes
    if (args.theme !== 'modern') {
      el.classList.add('cal2')
    }
    // Align Modern Grid color scheme with Basic Modern (table-mode palette)
    ;(el as any).__api = clndr(el, {
      ...args,
      template: GRID_TEMPLATE
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
    lengthOfTime: { days: 14, interval: 7 },
    applyThemeClasses: true,
    theme: 'grid'
  }
}

export default meta
export const Default: StoryObj = {}
export const Modern: StoryObj = { args: { theme: 'modern' } }
