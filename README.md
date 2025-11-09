# @brandontom/luxon-clndr

CLNDR is a jQuery calendar plugin. It was created -- you've heard this before --
out of frustration with the lack of truly dynamic front-end calendar plugins out
there.

Project repo: https://github.com/magicink/CLNDR

---

- [Install](https://github.com/magicink/CLNDR#install)
- [Dependencies](https://github.com/magicink/CLNDR#dependencies)
  - [Using Bun](https://github.com/magicink/CLNDR#using-bun)
- [Introduction: You Write The Markup](https://github.com/magicink/CLNDR#introduction-you-write-the-markup)
  - [The 'days' Array](https://github.com/magicink/CLNDR#the-days-array)
  - [Pass in your Events](https://github.com/magicink/CLNDR#pass-in-your-events)
- [Usage](https://github.com/magicink/CLNDR#usage)
  - [Multi-day Events](https://github.com/magicink/CLNDR#multi-day-events)
  - [Custom Classes](https://github.com/magicink/CLNDR#custom-classes)
  - [Styling (CSS Variables)](#styling-css-variables)
  - [Tailwind Styling](#tailwind-styling)
  - [Exported Templates](#exported-templates)
  - [Constraints & Datepickers](https://github.com/magicink/CLNDR#constraints--datepickers)
  - [Returning the Instance / API](https://github.com/magicink/CLNDR#returning-the-instance--public-api)
  - [Template Requirements](https://github.com/magicink/CLNDR#template-requirements)
- [Configuration](https://github.com/magicink/CLNDR#some-configuration)
  - [Template Rendering Engine](https://github.com/magicink/CLNDR#template-rendering-engine)
  - [Internationalization](https://github.com/magicink/CLNDR#internationalization)
  - [Lodash Template Delimiters](https://github.com/magicink/CLNDR#lodash-template-delimiters)
- [Browser Compatibility](https://github.com/magicink/CLNDR#browser-compatibility)
- [Submitting Issues](https://github.com/magicink/CLNDR#submitting-issues)

## Install

Install with Bun and use with a bundler, or load the UMD via a CDN.

- bun: `bun add @brandontom/luxon-clndr`

CDN (UMD global `clndr`):

```html
<script src="https://cdn.jsdelivr.net/npm/@brandontom/luxon-clndr/dist/clndr.umd.js"></script>
<!-- or -->
<script src="https://unpkg.com/@brandontom/luxon-clndr/dist/clndr.umd.js"></script>
```

Returning to grab a new version? Have a look at the `CHANGELOG.md` file.

If you'd like to run some tests in a particular browser or environment,
`tests/test.html` contains a list of basic functionality tests. When
contributing, please run these (and add to them when appropriate) before
submitting a pull request or issue!

## Dependencies

[jQuery](http://jquery.com/download/) is required. By default CLNDR can use
[Lodash](http://lodash.com/)'s `_.template()` function; however, if you specify
a custom rendering function (see documentation below) Lodash is not required.
Luxon is used via the DateAdapter.

### Using Bun

Install and run scripts with [Bun](https://bun.sh):

```shell
bun add @brandontom/luxon-clndr
```

Lodash is not installed by default. This allows you to use whichever templating
engine you want to. If you want to use the default `template` option with
Lodash, install it as a dependency of your project (prefer ESM build):
`bun add lodash-es` (or `bun add lodash` for CJS-only setups).

### Styles

This package ships a first-class CSS export for the default CLNDR styles. Import it from your app or docs site:

```ts
// ESM
import '@brandontom/luxon-clndr/clndr.css'
```

If you prefer to copy or customize the stylesheet, you can also reference the built file directly from `dist/clndr.css` in the package.

Theme and mode classes (opt-in)

- CLNDR can apply container classes so you don’t need external wrapper elements:
  - Mode: `clndr--mode-table | clndr--mode-grid | clndr--mode-months`
  - Theme: `clndr--theme-default | clndr--theme-grid | clndr--theme-months`
- Enable this by passing `applyThemeClasses: true` when you create CLNDR. Optionally set `theme`:

```ts
const api = clndr('#cal', {
  // Use the default month template
  template: DEFAULT_TEMPLATE,
  // Opt into container classes for styling
  applyThemeClasses: true,
  // Optional override (defaults by mode): 'default' | 'grid' | 'months'
  theme: 'default'
})
```

Backward compatibility: while the CSS is being refactored, CLNDR also adds a legacy wrapper class (`cal1|cal2|cal3`) on the host element when `applyThemeClasses` is true so the existing stylesheet continues to work without manual wrappers. Wrapper usage will be deprecated once the stylesheet targets the new classes directly.

### TypeScript Entry (ESM/UMD)

CLNDR's source of record is now TypeScript. The package publishes modern ESM and UMD bundles.

- ESM/TypeScript usage with bundlers:

Option A (script tags): load jQuery and the UMD bundle, then call the TS entry.

```ts
import { clndr } from '@brandontom/luxon-clndr'

const api = clndr('#calendar', {
  /* ...ClndrOptions */
})
```

Notes:

- The TS entry renders calendars directly while auto-registering the jQuery plugin when jQuery is detected.
- Type definitions ship with the package; no extra typings needed.

## Introduction: You Write The Markup

There are wonderful and feature-rich calendar modules out there and they all
suffer the same problem: they give you markup (and often a good heap of JS)
that you have to work with and style. This leads to a lot of hacking, pushing,
pulling, and annoying why-can't-it-do-what-I-want scenarios.

CLNDR doesn't generate markup (well, it has some reasonable defaults, but
that's an aside). Instead, CLNDR asks you to create a template and in return it
supplies your template with a great set of objects that will get you up and
running in a few lines.

### The 'Days' Array

Here's a typical CLNDR template. It's got a controller section and a grid
section.

```html
<div class="clndr-controls">
  <div class="clndr-previous-button">&lsaquo;</div>
  <div class="month"><%= month %></div>
  <div class="clndr-next-button">&rsaquo;</div>
</div>
<div class="clndr-grid">
  <div class="days-of-the-week">
    <% _.each(daysOfTheWeek, function (day) { %>
    <div class="header-day"><%= day %></div>
    <% }) %>
    <div class="days">
      <% _.each(days, function (day) { %>
      <div class="<%= day.classes %>"><%= day.day %></div>
      <% }) %>
    </div>
  </div>
</div>
```

The `days` array contains most of the stuff we need to make a calendar. Its
structure looks like this:

```javascript
{
  day: 5,
  events: [],
  classes: "day",
  date: '2015-12-31'
}
```

This makes quick work of generating a grid. `days.classes` contains extra
classes depending on the circumstance: if a given day is today, 'today' will
show up, as well as an 'event' class when an event lands on that day.

### Pass In Your Events

CLNDR accepts events as an array of objects:

```javascript
events = [
  {
    date: 'YYYY-MM-DD or some other ISO Date format',
    and: 'anything else'
  }
]
```

CLNDR looks through the objects in your events array for a `date` field unless
you specify otherwise using the `dateParameter` option. In your template the
`days` array will auto-magically contain these event objects in their entirety.
See the examples for a demonstration of how events populate the `days` array.

## Usage

CLNDR can use Lodash for templating. Lodash is required only if you are using
the built-in `template` option; if you provide your own `render()` function then
Lodash is not needed. Include jQuery before CLNDR since it is a jQuery plugin.

The bare minimum (CLNDR includes a default template):

```javascript
$('.parent-element').clndr()
```

With all of the available options:

```javascript
$('.parent-element').clndr({

  // The template: this could be stored in markup as a
  //   <script type="text/template"></script>
  // or pulled in as a string
  template: clndrTemplate,

  // Determines which month to start with using either a date string or a
  // native Date.
  startWithMonth: "YYYY-MM-DD" or new Date(),

  // Start the week off on Sunday (0), Monday (1), etc. Sunday is the default.
  // WARNING: if you are dealing with i18n and multiple languages, you
  // probably don't want this! See the "Internationalization" section below
  // for more.
  weekOffset: 0,

  // An array of day abbreviation labels. If not provided, CLNDR derives these
  // from the active locale and rotates them according to `weekOffset`.
  // WARNING: if you are dealing with i18n and multiple languages, you
  // probably don't want this! See the "Internationalization" section below
  // for more.
  daysOfTheWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],

  // Optional callback function that formats the day in the header. If none
  // supplied, defaults to the adapter's `dd` token and truncates to one character.
  // The callback is passed an adapter-native date value (Luxon DateTime) and a
  // string is to be returned.
  formatWeekdayHeader: function (day) {
    return (day.toFormat ? day.toFormat('dd') : '').charAt(0);
  },

  // The target classnames that CLNDR will look for to bind events.
  // these are the defaults.
  targets: {
    day: 'day',
    empty: 'empty',
    nextButton: 'clndr-next-button',
    todayButton: 'clndr-today-button',
    previousButton: 'clndr-previous-button',
    nextYearButton: 'clndr-next-year-button',
    previousYearButton: 'clndr-previous-year-button',
  },

  // Custom classes to avoid styling issues. pass in only the classnames that
  // you wish to override. These are the defaults.
  classes: {
    past: "past",
    today: "today",
    event: "event",
    selected: "selected",
    inactive: "inactive",
    lastMonth: "last-month",
    nextMonth: "next-month",
    adjacentMonth: "adjacent-month",
  },

  // Click callbacks! The keyword 'this' is set to the clndr instance in all
  // callbacks.
  clickEvents: {
    // Fired whenever a calendar box is clicked. Returns a 'target' object
    // containing the DOM element, any events, and the date as a Luxon DateTime.
    click: function (target) {...},

    // Fired when a user goes to the current month and year. Returns a Luxon
    // DateTime set to the correct month.
    today: function (month) {...},

    // Fired when a user goes forward a month. Returns a Luxon DateTime set
    // to the correct month.
    nextMonth: function (month) {...},

    // Fired when a user goes back a month. Returns a Luxon DateTime set
    // to the correct month.
    previousMonth: function (month) {...},

    // Fires any time the month changes as a result of a click action.
    // Returns a Luxon DateTime set to the correct month.
    onMonthChange: function (month) {...},

    // Fired when the next year button is clicked. Returns a Luxon DateTime
    // set to the correct month and year.
    nextYear: function (month) {...},

    // Fired when the previous year button is clicked. Returns a Luxon DateTime
    // set to the correct month and year.
    previousYear: function (month) {...},

    // Fires any time the year changes as a result of a click action. If
    // onMonthChange is also set, it is fired BEFORE onYearChange. Returns
    // a Luxon DateTime set to the correct month and year.
    onYearChange: function (month) {...},

    // Fired when a user goes forward a period. Returns Luxon DateTime objects
    // for the updated start and end date.
    nextInterval: function (start, end) {...},

    // Fired when a user goes back an interval. Returns Luxon DateTime
    // objects for the updated start and end date.
    previousInterval: function (start, end) {...},

    // Fired whenever the time period changes as configured in lengthOfTime.
    // Returns Luxon DateTime objects for the updated start and end date.
    onIntervalChange: function (start, end) {...}
  },

  // Use the 'touchstart' event instead of 'click'
  useTouchEvents: false,

  // This is called only once after clndr has been initialized and rendered.
  // use this to bind custom event handlers that don't need to be re-attached
  // every time the month changes (most event handlers fall in this category).
  // Hint: this.element refers to the parent element that holds the clndr,
  // and is a great place to attach handlers that don't get tossed out every
  // time the clndr is re-rendered.
  ready: function () { },

  // A callback when the calendar is done rendering. This is a good place
  // to bind custom event handlers (also see the 'ready' option above).
  doneRendering: function () {...},

  // An array of event objects
  events: [
    {
      title: 'This is an event',
      date: '2000-08-20'
    },
    ...
  ],

  // If you're supplying an events array, dateParameter points to the field
  // in your event object containing a date string. It's set to 'date' by
  // default.
  dateParameter: 'date',

  // CLNDR can accept events lasting more than one day! just pass in the
  // multiDayEvents option and specify what the start and end fields are
  // called within your event objects. See the example file for a working
  // instance of this.
  multiDayEvents: {
    endDate: 'endDate',
    startDate: 'startDate',
    // If you also have single day events with a different date field,
    // use the singleDay property and point it to the date field.
    singleDay: 'date'
  },

  // Show the dates of days in months adjacent to the current month. Defaults
  // to true.
  showAdjacentMonths: true,

  // When days from adjacent months are clicked, switch the current month.
  // fires nextMonth/previousMonth/onMonthChange click callbacks. defaults to
  // false.
  adjacentDaysChangeMonth: false,

  // Always make the calendar six rows tall (42 days) so that every month has
  // a consistent height. defaults to 'false'.
  forceSixRows: null,

  // Set this to true, if you want the plugin to track the last clicked day.
  // If trackSelectedDate is true, "selected" class will always be applied
  // only to the most recently clicked date; otherwise - selectedDate will
  // not change.
  trackSelectedDate: false,

  // Set this, if you want a date to be "selected" (see classes.selected)
  // after plugin init. Defualts to null, no initially selected date.
  selectedDate: null,

  // Set this to true if you don't want `inactive` dates to be selectable.
  // This will only matter if you are using the `constraints` option.
  ignoreInactiveDaysInSelection: null,

  // CLNDR can render in any time interval!
  // You can specify if you want to render one or more months, or one ore more
  // days in the calendar, as well as the paging interval whenever forward or
  // back is triggered. If both months and days are null, CLNDR will default
  // to the standard monthly view.
  lengthOfTime: {
    // Set to an integer if you want to render one or more months, otherwise
    // leave this null
    months: null,

    // Set to an integer if you want to render one or more days, otherwise
    // leave this null. Setting this to 14 would render a 2-week calendar.
    days: null,

    // This is the amount of months or days that will move forward/back when
    // paging the calendar. With days=14 and interval=7, you would have a
    // 2-week calendar that pages forward and backward 1 week at a time.
    interval: 1
  },

  // Any other data variables you want access to in your template. This gets
  // passed into the template function.
  extras: {},

  // If you want to use a different templating language, here's your ticket.
  // Precompile your template (before you call clndr), pass the data from the
  // render function into your template, and return the result. The result
  // must be a string containing valid markup. The keyword 'this' is set to
  // the clndr instance in case you need access to any other properties.
  // More under 'Template Rendering Engine' below.
  render: function (data) {
    return '<div class="html data as a string"></div>';
  },

  // If you want to prevent the user from navigating the calendar outside
  // of a certain date range (e.g. if you are making a datepicker), specify
  // either the startDate, endDate, or both in the constraints option. You
  // can change these while the calendar is on the page... See documentation
  // below for more on this!
  constraints: {
    startDate: '2017-12-22',
    endDate: '2018-01-09'
  },

  // You can provide `locale`/`zone` if needed.
});
```

All of the things you have access to in your template:

```javascript
// An array of day-of-the-week abbreviations, shifted as requested using the
// weekOffset parameter.
daysOfTheWeek: ['S', 'M', 'T', etc...]

// The number of 7-block calendar rows, in the event that you want to do some
// looping with it
numberOfRows: 5

// The days array, documented in more detail above
days: [{ day, classes, id, events, date }]

// The month name- don't forget that you can do things like
// month.substring(0, 1) and month.toLowerCase() in your template
month: "May"

// The year that the calendar is currently focused on
year: "2013"

// All of the events happening this month. This will be empty of the
// lengthOfTime config option is set.
eventsThisMonth: []
// All of the events happening last month. This is only set if
// showAdjacementMonths is true.
eventsLastMonth: []
// All of the events happening next month. This is only set if
// showAdjacementMonths is true.
eventsNextMonth: []

// If you specified a custom lengthOfTime, you will have these instead.
intervalEnd: (Luxon DateTime)
intervalStart: (Luxon DateTime)
eventsThisInterval: []

// Anything you passed into the 'extras' property when creating the clndr
extras: {}
```

### Multi-day Events

CLNDR accepts events lasting more than one day. You just need to tell it how to
access the start and end dates of your events:

```javascript
var lotsOfEvents = [
  {
    end: '2013-11-08',
    start: '2013-11-04',
    title: 'Monday to Friday Event'
  },
  {
    end: '2013-11-20',
    start: '2013-11-15',
    title: 'Another Long Event'
  }
]

$('#calendar').clndr({
  events: lotsOfEvents,
  multiDayEvents: {
    endDate: 'end',
    startDate: 'start'
  }
})
```

When looping through days in my template, 'Monday to Friday Event' will be
passed to _every single day_ between the start and end date. See index.html in
the example folder for a demo of this feature.

#### Mixing Multi- and Single-day Events

If you _also_ have single-day events mixed in with different date fields, as of
clndr `v1.2.7` you can specify a third property of `multiDayEvents` called
`singleDay` that refers to the date field for a single-day event.

```
var lotsOfMixedEvents = [
  {
    end: '2015-11-08',
    start: '2015-11-04',
    title: 'Monday to Friday Event'
  }, {
    end: '2015-11-20',
    start: '2015-11-15',
    title: 'Another Long Event'
  }, {
    title: 'Birthday',
    date: '2015-07-16'
  }
];

$('#calendar').clndr({
  events: lotsOfEvents,
  multiDayEvents: {
    endDate: 'end',
    singleDay: 'date',
    startDate: 'start'
  }
});
```

### Custom Classes

The classes that get added to a `day` object automatically can be customized to
avoid styling conflicts. The `classes` option accepts `today`, `event`, `past`,
`lastMonth`, `nextMonth`, `adjacentMonth`, and `inactive`. Pass in only the
classnames you wish to override and the rest will be set to their defaults.

In this example we create a `my-` namespace for all of the classes:

```javascript
clndr.customClasses = $('#custom-classes').clndr({
  classes: {
    past: 'my-past',
    today: 'my-today',
    event: 'my-event',
    inactive: 'my-inactive',
    lastMonth: 'my-last-month',
    nextMonth: 'my-next-month',
    adjacentMonth: 'my-adjacent-month'
  }
})
```

To configure the `day`, `empty`, and next/previous/today/etc. button classes,
use the `targets` option documented in the
[usage](https://github.com/magicink/CLNDR#usage) section.

### Styling (CSS Variables)

CLNDR exposes a set of CSS custom properties you can override to customize spacing, colors, and typography. Define overrides on the calendar root (the element you pass to `clndr(...)`) or cascade them from a parent.

Example:

```css
.my-calendar .clndr {
  /* Colors */
  --clndr-accent: oklch(70% 0.12 240);
  --clndr-selected-bg: oklch(70% 0.18 330);
  /* Sizing */
  --clndr-grid-cell-size: 32px;
  --clndr-grid-gap: 2px;
}
```

Overrideable variables and defaults

| Variable                                | Default                            | Purpose                                          |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------ |
| `--clndr-grid-cell-size`                | `25px`                             | Grid cell size (grid/months modes).              |
| `--clndr-grid-gap`                      | `0px`                              | Gap between grid cells.                          |
| `--clndr-radius`                        | `4px`                              | Rounding for modern interval grids.              |
| `--clndr-month-gap`                     | `8px`                              | Gap between whole months (month-interval views). |
| `--clndr-border`                        | `oklch(66.46% 0.2222 25.65)`       | Grid/frame border color.                         |
| `--clndr-accent`                        | `oklch(66.46% 0.2222 25.65)`       | Weekday header background (grid).                |
| `--clndr-event-bg`                      | `oklch(85.93% 0.0987 135.79)`      | Event day background.                            |
| `--clndr-today-bg`                      | `oklch(83.36% 0.0950 87.16)`       | Today background (grid theme).                   |
| `--clndr-selected-bg`                   | `oklch(73.43% 0.1627 332.04)`      | Selected day background.                         |
| `--clndr-muted-bg`                      | `oklch(89.75% 0.0000 0.00)`        | Empty/adjacent/inactive background.              |
| `--clndr-inactive-text-color`           | `oklch(59.99% 0.0000 0.00)`        | Inactive text color.                             |
| `--clndr-table-header-bg`               | `oklch(52.12% 0.1175 241.01)`      | Table header background.                         |
| `--clndr-table-header-text`             | `oklch(100.00% 0.0000 0.00)`       | Table header text color.                         |
| `--clndr-table-border-color`            | `oklch(0.00% 0.0000 0.00)`         | Table border color.                              |
| `--clndr-day-hover-bg`                  | `oklch(94.91% 0.0000 0.00)`        | Day hover background (table mode).               |
| `--clndr-table-today-bg`                | `oklch(83.96% 0.0637 212.57)`      | Today background (table mode).                   |
| `--clndr-table-today-hover-bg`          | `oklch(77.99% 0.0855 213.06)`      | Today hover background (table mode).             |
| `--clndr-table-today-event-bg`          | `oklch(84.80% 0.0649 162.94)`      | Today + event background (table mode).           |
| `--clndr-event-hover-bg`                | `oklch(80.64% 0.1382 136.12)`      | Event hover background.                          |
| `--clndr-empty-bg`                      | `oklch(94.91% 0.0000 0.00)`        | Empty cell background.                           |
| `--clndr-inactive-alt-bg`               | `oklch(73.80% 0.0000 0.00)`        | Alternate inactive background.                   |
| `--clndr-control-hover-bg`              | `oklch(89.75% 0.0000 0.00)`        | Control hover background.                        |
| `--clndr-control-hover-bg-soft`         | `oklch(96.72% 0.0000 0.00)`        | Soft control hover background.                   |
| `--clndr-surface-bg`                    | `oklch(96.72% 0.0000 0.00)`        | Surface/background behind sections.              |
| `--clndr-day-bg`                        | `oklch(100.00% 0.0000 0.00)`       | Default day cell background.                     |
| `--clndr-rule-color`                    | `oklch(37.53% 0.0000 0.00)`        | Divider/rule color.                              |
| `--clndr-month-min-width`               | `177px`                            | Min width per month tile (months view).          |
| `--clndr-months-controls-margin-bottom` | `8px`                              | Gap under month header (months view).            |
| `--clndr-controls-bottom-margin`        | `3px`                              | Gap below top controls row.                      |
| `--clndr-nav-padding`                   | `0.1em 0.25em`                     | Nav arrow hit-area padding.                      |
| `--clndr-table-header-height`           | `30px`                             | Table-mode header cell height.                   |
| `--clndr-table-day-height`              | `85px`                             | Table-mode day cell height.                      |
| `--clndr-table-day-padding`             | `8px`                              | Table-mode day cell padding.                     |
| `--clndr-heading-bg`                    | `oklch(52.65% 0.1637 19.70)`       | Heading/banner background.                       |
| `--clndr-heading-text`                  | `oklch(100.00% 0.0000 0.00)`       | Heading text color.                              |
| `--clndr-header-text-contrast`          | `oklch(0.00% 0.0000 0.00)`         | Header text contrast color.                      |
| `--clndr-font-family`                   | `'Droid Sans Mono'`                | Base font family.                                |
| `--clndr-font-size`                     | `14px`                             | Base font size.                                  |
| `--clndr-heading-font-size`             | `14px`                             | Heading font size.                               |
| `--clndr-subheading-font-size`          | `1em`                              | Subheading font size.                            |
| `--clndr-weekday-header-font-size`      | `10px`                             | Weekday header font size.                        |
| `--clndr-day-font-size`                 | `12px`                             | Day number font size.                            |
| `--clndr-nav-size`                      | `calc(var(--clndr-font-size) * 2)` | Nav arrow size.                                  |

Notes

- In modern themes, some variables may be overridden per mode (e.g., table mode sets `--clndr-grid-gap: 1px`). You can still override them on the container to force a value.
- Variables use OKLCH color values by default for better perceptual uniformity; standard CSS color values work as well.

### Tailwind Styling

You can style CLNDR using Tailwind in two complementary ways:

- Override the built‑in CSS variables with Tailwind’s arbitrary properties.
- Add component/utility layers that map Tailwind tokens to CLNDR selectors.

Quick start (arbitrary properties)

```html
<div id="cal" class="my-calendar"></div>

<script type="module">
  import { clndr, DEFAULT_TEMPLATE } from '@brandontom/luxon-clndr'
  // Apply Tailwind-driven variables on a parent or the .clndr itself
  const host = document.querySelector('#cal')!
  host.classList.add(
    // Sizing
    '[--clndr-grid-cell-size:2.25rem]',
    '[--clndr-grid-gap:0.125rem]',
    // Palette
    '[--clndr-border:theme(colors.slate.300)]',
    '[--clndr-accent:theme(colors.slate.800)]',
    '[--clndr-header-text-contrast:theme(colors.white)]',
    '[--clndr-selected-bg:theme(colors.pink.500)]',
    '[--clndr-muted-bg:theme(colors.slate.100)]'
  )
  clndr('#cal', { template: DEFAULT_TEMPLATE, applyThemeClasses: true, theme: 'modern' })
</script>
```

Because CLNDR reads CSS variables from its `.clndr` root, you can set them on the host element or any ancestor. Tailwind’s arbitrary property syntax (`[--var:value]`) works well here and supports `theme(...)` lookups.

Reusable utilities (@layer)

Add a small utility group that maps Tailwind tokens to CLNDR variables:

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .clndr-vars-slate {
    --clndr-border: theme(colors.slate.300);
    --clndr-accent: theme(colors.slate.800);
    --clndr-header-text-contrast: theme(colors.white);
    --clndr-selected-bg: theme(colors.pink.500);
    --clndr-muted-bg: theme(colors.slate.100);
    --clndr-control-hover-bg: theme(colors.slate.100);
    --clndr-surface-bg: theme(colors.slate.50);
  }
  .clndr-size-md {
    --clndr-grid-cell-size: 2.25rem; /* 36px */
    --clndr-grid-gap: 0.125rem; /* 2px */
  }
}
```

Then apply to the calendar host:

```html
<div id="cal" class="clndr-vars-slate clndr-size-md"></div>
```

Dark mode example

```css
@layer utilities {
  .dark .clndr-vars-slate {
    --clndr-border: theme(colors.slate.700);
    --clndr-accent: theme(colors.slate.700);
    --clndr-header-text-contrast: theme(colors.white);
    --clndr-muted-bg: theme(colors.slate.800);
    --clndr-day-bg: theme(colors.slate.900);
  }
}
```

Component tweaks with @apply

CLNDR ships sensible defaults. If you want to adjust layout/spacing using Tailwind utilities, target CLNDR’s selectors inside a component layer:

```css
@layer components {
  /* Center the grid and space the controls */
  .clndr.clndr--theme-modern .clndr-controls {
    @apply mb-2 mx-auto;
  }
  .clndr.clndr--theme-modern .clndr-grid {
    @apply mx-auto rounded-md;
  }
  .clndr .clndr-today-button {
    @apply w-full text-center cursor-pointer hover:bg-slate-100;
  }
}
```

Notes

- Import the library CSS once (e.g., in your app entry) so the structure and variables exist: `import '@brandontom/luxon-clndr/clndr.css'`.
- Prefer overriding variables for theme/palette/size, and use `@apply` sparingly for layout tweaks.
- If you use the opt-in classes (`applyThemeClasses: true`), you’ll get mode/theme helpers like `clndr--mode-grid`, `clndr--theme-modern` for targeting.

### Exported Templates

CLNDR ships a few ready‑to‑use HTML templates you can plug in directly or pre‑compile with your preferred engine. They’re exported from the main entry for ESM and UMD builds.

Exports

- `DEFAULT_TEMPLATE` — Classic single‑month template (month name + weekday headers + 7×N grid + Today button).
- `GRID_INTERVAL_TEMPLATE` — Rolling grid interval (e.g., 14 days with a 7‑day paging interval).
- `MONTHS_INTERVAL_TEMPLATE_MODERN` — Modern multi‑month header with side‑by‑side month grids.

Usage (ESM)

```ts
import {
  clndr,
  DEFAULT_TEMPLATE,
  GRID_INTERVAL_TEMPLATE,
  MONTHS_INTERVAL_TEMPLATE_MODERN
} from '@brandontom/luxon-clndr'

// 1) Classic monthly view (uses defaults)
clndr('#cal-month', {
  template: DEFAULT_TEMPLATE,
  applyThemeClasses: true, // optional convenience classes
  theme: 'default'
})

// 2) 14‑day rolling interval grid (pages 7 days at a time)
clndr('#cal-grid', {
  template: GRID_INTERVAL_TEMPLATE,
  lengthOfTime: { days: 14, interval: 7 },
  applyThemeClasses: true,
  theme: 'grid'
})

// 3) Three‑month side‑by‑side months view
clndr('#cal-months', {
  template: MONTHS_INTERVAL_TEMPLATE_MODERN,
  lengthOfTime: { months: 3 },
  applyThemeClasses: true,
  theme: 'months'
})
```

Template compilation

- If you pass `template: <string>`, CLNDR will compile it with `_.template` when a global `_` is available (UMD + Lodash/Underscore). Otherwise it falls back to a minimal internal compiler that supports `<%= ... %>` substitutions only.
- For ESM projects, prefer pre‑compiling the exported template with Lodash (or your engine of choice) and passing it via `render`:

```ts
import _ from 'lodash-es'
import { clndr, DEFAULT_TEMPLATE } from '@brandontom/luxon-clndr'

const render = _.template(DEFAULT_TEMPLATE)
clndr('#cal', { render })
```

TypeScript helper

- `TemplateRenderer` is exported if you’d like to type your custom renderer: `(data) => string`.

### Constraints & Datepickers

If you are making a datepicker or you'd just like to prevent users from
`next`ing all the way to 2034 in your calendar, you can pass a `constraints`
option with `startDate`, `endDate`, or both specified:

```javascript
$('#calendar').clndr({
  constraints: {
    endDate: '2015-07-16',
    startDate: '2015-05-06'
  }
})
```

Now your calendar's next and previous buttons will only work within this date
range. When they become disabled they will have the class 'inactive', which you
can use to gray them out or add gif flames or whatever.

The days in your grid that are outside of the range will also have the
`inactive` class. This means that you will want to add a click callback and
check for whether or not a day has the class `inactive`. It will look like this:

```javascript
$('#calendar').clndr({
  constraints: {
    endDate: '2015-07-16',
    startDate: '2015-05-06'
  },
  clickEvents: {
    click: function (target) {
      if (!$(target.element).hasClass('inactive')) {
        console.log('You picked a valid date!')
      } else {
        console.log('That date is outside of the range.')
      }
    }
  }
})
```

The constraints can be updated at any time via `clndr.options.constraints`. If
you make a change, call `render()` afterwards so that clndr can update your
interface with the appropriate classes.

```javascript
myCalendar.options.constraints.startDate = '1999-12-31'
myCalendar.render()
```

Make sure the `startDate` comes before the `endDate`!

### Returning the Instance / Public API

It's possible to save the clndr object in order to call it from JS later. There
are functions to increment or set the month or year. You can also provide a new
events array.

```javascript
// Create a CLNDR and save the instance as myCalendar
var myCalendar = $('#myCalendar').clndr()

// Go to the next month
myCalendar.forward()

// Go to the previous month
myCalendar.back()

// Set the month using a number from 0-11 or a month name
myCalendar.setMonth(0)
myCalendar.setMonth('February')

// Go to the next year
myCalendar.nextYear()

// Go to the previous year
myCalendar.previousYear()

// Set the year
myCalendar.setYear(1997)

// Go to today:
myCalendar.today()

// Overwrite the extras. Note that this triggers a re-render of the calendar.
myCalendar.setExtras(newExtras)

// Change the events. Note that this triggers a re-render of the calendar.
myCalendar.setEvents(newEventsArray)

// Add events. Note that this triggers a re-render of the calendar.
myCalendar.addEvents(additionalEventsArray)

// Remove events.  All events for which the passed in function returns true will
// be removed from the calendar. Note that this triggers a re-render of the
// calendar.
myCalendar.removeEvents(function (event) {
  return event.id === idToRemove
})

// Destroy the clndr instance. This will empty the DOM node containing the
// calendar.
myCalendar.destroy()
```

If you are taking advantage of the `onMonthChange` and `onYearChange` callbacks,
you might want them to fire whenver you call `setMonth`, `setYear`, `forward`,
`back`, etc. Just pass in an object as an argument with `withCallbacks: true`
like this:

```javascript
// Month will be set to February and then onMonthChange will be fired.
myCalendar.setMonth('February', { withCallbacks: true })

// Month will increment and onMonthChange, and possibly onYearChange, will be
// fired.
myCalendar.next({ withCallbacks: true })
```

### Template Requirements

CLNDR is structured so that you don't really _need_ anything in your template.

```javascript
<% _.each(days, function (day) { %>
<div class='<%= day.classes %>'><%= day.day %></div>
<% }); %>
```

Currently CLNDR sets the class on a day to `'calendar-day-2013-05-30'` and uses
it to determine the date when a user clicks on it. Thus, click events will only
work if `days.classes` is included in your day element's `class` attribute as
seen above.

## Configuration

### Date Library (Luxon)

CLNDR runs with Luxon via a DateAdapter boundary.

- Configure `locale` and `zone` as needed.

### Template Rendering Engine

You can pass in a `render` function as an option, for example:

```javascript
var precompiledTemplate = myRenderingEngine.template($('#my-template').html())

$('#my-calendar').clndr({
  render: function (data) {
    return precompiledTemplate(data)
  }
})
```

Where the function must return the HTML result of the rendering operation. In
this case you would precompile your template elsewhere in your code, since CLNDR
only cares about your template if it's going to use Lodash.

If you are using your own render method, Lodash is NOT a dependency of
this plugin.

CLNDR has been tested successfully with [doT.js](http://olado.github.io/doT/),
[Hogan.js](http://twitter.github.io/hogan.js/),
[Handlebars.js](http://handlebarsjs.com/),
[Mustache.js](https://github.com/janl/mustache.js/), and
[Knockout.js](https://github.com/karl-sjogren/clndr-knockout). Please get in touch
if you have success with other languages and they will be documented here.

Here's an example using [doT.js](http://olado.github.io/doT/)...

The markup:

```html
<script id="dot-template" type="text/template">
  <div class="clndr-controls">
    <div class="clndr-previous-button">&lsaquo;</div>
    <div class="month">{{= it.month }}</div>
    <div class="clndr-next-button">&rsaquo;</div>
  </div>
  <div class="clndr-grid">
    <div class="days-of-the-week">
    {{~it.daysOfTheWeek :day:index}}
      <div class="header-day">{{= day }}</div>
    {{~}}
      <div class="days">
      {{~it.days :day:index}}
        <div class="{{= day.classes }}">{{= day.day }}</div>
      {{~}}
      </div>
    </div>
  </div>
</script>
```

The Javascript:

```javascript
var clndrTemplate = doT.template($('#dot-template').html())

$('#calendar').clndr({
  render: function (data) {
    return clndrTemplate(data)
  }
})
```

Here's an example using [Mustache.js](https://github.com/janl/mustache.js/)...

The markup:

```html
<script type="x-tmpl-mustache" id="calendar-tmpl">
  <div class="controls">
    <span class="clndr-previous-button">prev</span>
    <span class="month">{{month}}</span>
    <span class="year">{{year}}</span>
    <span class="clndr-next-button">next</span>
  </div>
  <div class="days-container">
    <div class="days">
      <div class="headers">
        {{#daysOfTheWeek}}
          <div class="day-header">{{.}}</div>
        {{/daysOfTheWeek}}
      </div>
      {{#days}}
        <div class="{{classes}}" id="{{id}}">{{day}}</div>
      {{/days}}
    </div>
  </div>
</script>
```

The Javascript:

```javascript
$('#calendar').clndr({
  render: function (data) {
    return Mustache.render($('#calendar-tmpl').html(), data)
  }
})
```

### Internationalization

CLNDR supports internationalization via Luxon.

- Set `locale` (e.g., `'fr'`) to localize month names and weekday headers.
- Optionally set `zone` with an IANA timezone (e.g., `'Europe/Paris'`).
- Week start is controlled with `weekOffset` (0 = Sunday). If you need custom
  weekday headers, set `daysOfTheWeek` or provide `formatWeekdayHeader`.
- Ensure your environment includes full ICU data so Luxon locales render
  correctly (see CI example in this repo for `NODE_ICU_DATA`).

### Lodash Template Delimiters

If you're not a fan of `<% %>` and `<%= %>` style delimiters you can provide
Lodash with alternatives in the form of regular expressions. There are
three delimiters...

**interpolate**, which outputs a string (this is `<%= %>` by default)

**escape**, for escaping HTML (this is `<%- %>` by default)

**evaluate**, for evaluating javascript (this is `<% %>` by default)

If you're more comfortable with Jinja2/Twig/Nunjucks style delimiters, simply
call this before you instantiate your clndr:

```javascript
// Switch to Jinja2/Twig/Nunjucks-style delimiters
_.templateSettings = {
  escape: /\{\{\-(.+?)\}\}/g,
  evaluate: /\{\%(.+?)\%\}/g,
  interpolate: /\{\{(.+?)\}\}/g
}
```

### Browser Compatibility

Legacy browsers like IE8 are not officially supported. Verify features in your
target environments and consider appropriate polyfills as needed.

## Submitting Issues

GitHub issues and support tickets are to be submitted only for bugs. We sadly
don't have the time or manpower to answer implementation questions, debug your
application code, or anything that isn't directly related to a CLNDR bug :D
There are many wonderful places to seek help, like Stack Overflow.

## For Contributors

### Scripts

Use Bun to run the scripts below:

```sh
bun run <script>
```

- `build`: Clean `dist` and build development bundles with Rollup.
- `build:prod`: Build production bundles (minified) with Rollup.
- `build:ts`: Transpile TypeScript to `dist` via `tsc`.
- `build:watch`: Watch sources and rebuild on change.
- `type-check`: Run TypeScript type checking only (no emit).
- `test`: Run the Jest test suite.
- `test:cov`: Run tests and collect coverage.
- `test:watch`: Run tests in watch mode.
- `format`: Format the repo with Prettier.
- `format:check`: Check formatting without writing changes.
- `prepare`: Install-time hook to set up Husky git hooks (safe no-op outside Git).
- `size`: Print built artifact sizes in `dist/`.
- `smoke`: Run Puppeteer-based smoke tests against `demo/index.html` and `tests/test.html` (TypeScript runner via Bun).
- `smoke:node`: Node.js ESM variant of the smoke tests.
- `ci:check`: End-to-end CI validation: type-check, TS compile, build, unit tests with coverage, and smoke tests.

Notes:

- Some scripts (smoke) use Puppeteer to launch a headless browser; ensure your environment can run Chromium. Bun is used by a few developer scripts, but Node-based variants are also provided.
