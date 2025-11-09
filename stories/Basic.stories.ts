import type { Meta, StoryObj } from '@storybook/html'
import { clndr, DEFAULT_TEMPLATE } from '../src/ts'
import { createContainer } from './utils'

// Grid-based modern markup for the basic (single-month) view
const BASIC_TEMPLATE_MODERN = `
<div class="clndr-controls">
  <div class="clndr-previous-button">&lsaquo;</div>
  <div class="month"><%= month %> <%= year %></div>
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
  title: 'CLNDR/Basic',
  render: (args: any) => {
    const el = createContainer(600)
    // Apply legacy wrapper only for legacy default theme
    if (args.theme !== 'modern') {
      el.classList.add('cal1')
    }
    const api = clndr(el, {
      ...args,
      template:
        args.theme === 'modern' ? BASIC_TEMPLATE_MODERN : DEFAULT_TEMPLATE
    })
    // Force exact grid width to avoid subpixel accumulation that thickens the right edge
    if (args.theme === 'modern') {
      const grid = el.querySelector('.clndr .clndr-grid') as HTMLElement | null
      if (grid) grid.style.inlineSize = '600px'
    }
    // For modern theme, set variables to match classic Basic (cal1) sizes/colors
    if (args.theme === 'modern') {
      const root = el.querySelector('.clndr') as HTMLElement | null
      if (root) {
        // Match width to 600px container: 600 / 7 per column; keep zero gap
        root.style.setProperty(
          '--clndr-grid-cell-size',
          'calc((600px - 6px) / 7)'
        )
        root.style.setProperty('--clndr-grid-gap', '1px')
        // Map modern vars to classic palette
        root.style.setProperty(
          '--clndr-border',
          'var(--clndr-table-border-color)'
        )
        root.style.setProperty('--clndr-accent', 'var(--clndr-table-header-bg)')
        root.style.setProperty(
          '--clndr-header-text-contrast',
          'var(--clndr-table-header-text)'
        )
        root.style.setProperty(
          '--clndr-today-bg',
          'var(--clndr-table-today-bg)'
        )
        root.style.setProperty('--clndr-muted-bg', 'var(--clndr-empty-bg)')
      }
    }
    ;(el as any).__api = api
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
