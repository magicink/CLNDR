import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'

// Grid-based modern markup for the basic (single-month) view
const BASIC_TEMPLATE_LEGACY = `\n<div class='clndr-controls'>
  <div class='clndr-control-button'>
    <span class='clndr-previous-button'>previous</span>
  </div>
  <div class='month'><%= month %> <%= year %></div>
  <div class='clndr-control-button rightalign'>
    <span class='clndr-next-button'>next</span>
  </div>
</div>
<table class='clndr-table' border='0' cellspacing='0' cellpadding='0'>
  <thead>
    <tr class='header-days'>
      <% for(var i = 0; i < daysOfTheWeek.length; i++) { %>
        <td class='header-day'><%= daysOfTheWeek[i] %></td>
      <% } %>
    </tr>
  </thead>
  <tbody>
    <% for(var i = 0; i < numberOfRows; i++){ %>
      <tr>
        <% for(var j = 0; j < 7; j++){ %>
          <% var d = j + i * 7; %>
          <td class='<%= days[d].classes %>'>
            <div class='day-contents'><%= days[d].day %></div>
          </td>
        <% } %>
      </tr>
    <% } %>
  </tbody>
</table>\n`.trim()

const meta: Meta = {
  title: 'CLNDR/Basic',
  render: (args: any) => {
    const el = createContainer(600)
    // Apply legacy wrapper only for legacy default theme
    if (args.theme !== 'modern') {
      el.classList.add('cal1')
    }
    ;(el as any).__api = clndr(el, {
      ...args,
      template:
        args.theme === 'modern' ? DEFAULT_TEMPLATE : BASIC_TEMPLATE_LEGACY
    })
    return el
  },
  argTypes: {
    weekOffset: { control: 'number' },
    showAdjacentMonths: { control: 'boolean' },
    adjacentDaysChangeMonth: { control: 'boolean' }
  },
  args: {
    weekOffset: 0,
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: false,
    applyThemeClasses: true,
    theme: 'default'
  }
}

export default meta
export const Default: StoryObj = {}
export const Modern: StoryObj = { args: { theme: 'modern' } }
