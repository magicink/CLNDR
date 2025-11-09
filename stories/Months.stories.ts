import type { Meta, StoryObj } from '@storybook/html'
import { clndr } from '../src/ts'
import { createContainer } from './utils'

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

// Modern markup: arrows and month names in a single header row using grid/flex
const MONTHS_TEMPLATE_MODERN = `
<div class="clndr-controls months-header">
  <div class="clndr-previous-button">&lsaquo;</div>
  <div class="months-titles">
    <% for (var m = 0; m < months.length; m++) { var cal = months[m]; %>
      <div class="month"><%= cal.month.format('MMMM') %></div>
    <% } %>
  </div>
  <div class="clndr-next-button">&rsaquo;</div>
  </div>
<div class="months-body">
  <% for (var m = 0; m < months.length; m++) { var cal = months[m]; %>
    <div class="cal">
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
        args.theme === 'modern' ? MONTHS_TEMPLATE_MODERN : MONTHS_TEMPLATE
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
    theme: 'months'
  }
}

export default meta
export const Default: StoryObj = {}
export const Modern: StoryObj = { args: { theme: 'modern' } }
