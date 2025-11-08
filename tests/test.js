// Ensure global access from console even when loaded as a module script
var clndr = (window.clndr = window.clndr || {})

// Use Luxon directly for dates in this demo page
var DateTime = (window.luxon && window.luxon.DateTime) || null
if (!DateTime) {
  console.error('Luxon DateTime is required for tests/test.js')
}

if (!window.console) {
  window.console = {
    log: function () {
      // sad face.
    }
  }
}

$(function () {
  // Set up the events array
  var eventsArray = [
    {
      title: 'This is an Event',
      date: DateTime.now().set({ day: 7 }).toFormat('yyyy-LL-dd')
    },
    {
      title: 'Another Event',
      date: DateTime.now().set({ day: 23 }).toFormat('yyyy-LL-dd')
    }
  ]

  // Declare all vars at the top
  var i
  var j
  var start
  var padDay
  var daysInMonth
  var multidayArray
  var multidayMixedArray
  var multidayLongArray
  var performanceSeconds
  var multidayMixedPerfArray

  // Default
  // =========================================================================
  clndr.defaultSetup = $('#default').clndr()

  // Test showAdjacentMonths and adjacentDaysChangeMonth.
  // Edges of other months should be visible and clicking them should switch
  // the month.
  // =========================================================================
  clndr.adjacent = $('#adjacent').clndr({
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: true
  })

  // Pass in a template
  // =========================================================================
  clndr.passInATemplate = $('#pass-in-a-template').clndr({
    template: $('#clndr-template').html()
  })

  // Pass in events
  // =========================================================================
  clndr.passInEvents = $('#pass-in-events').clndr({
    events: eventsArray
  })

  // Test the clickEvent callbacks
  // =========================================================================
  clndr.callbacks = $('#callbacks').clndr({
    ready: function () {
      console.log('The callbacks calendar just called ready()')
    },
    clickEvents: {
      click: function (target) {
        console.log('click', target)
      },
      today: function (month) {
        console.log('today', month)
      },
      nextYear: function (month) {
        console.log('next year', month)
      },
      nextMonth: function (month) {
        console.log('next month', month)
      },
      previousYear: function (month) {
        console.log('previous year', month)
      },
      onYearChange: function (month) {
        console.log('on year change', month)
      },
      previousMonth: function (month) {
        console.log('previous month', month)
      },
      onMonthChange: function (month) {
        console.log('on month change', month)
      }
    },
    doneRendering: function () {
      console.log('The callbacks calendar just called doneRendering()')
    }
  })

  // Test multi-day events
  // =========================================================================
  multidayArray = [
    {
      title: 'Multi1',
      endDate: DateTime.now().set({ day: 17 }).toFormat('yyyy-LL-dd'),
      startDate: DateTime.now().set({ day: 12 }).toFormat('yyyy-LL-dd')
    },
    {
      title: 'Multi2',
      endDate: DateTime.now().set({ day: 27 }).toFormat('yyyy-LL-dd'),
      startDate: DateTime.now().set({ day: 24 }).toFormat('yyyy-LL-dd')
    }
  ]

  clndr.multiday = $('#multiday').clndr({
    events: multidayArray,
    multiDayEvents: {
      endDate: 'endDate',
      startDate: 'startDate'
    },
    clickEvents: {
      click: function (target) {
        console.log(target)
      }
    }
  })

  // Test multi-day events
  // =========================================================================
  multidayMixedArray = [
    {
      title: 'Multi1',
      endDate: DateTime.now().set({ day: 17 }).toFormat('yyyy-LL-dd'),
      startDate: DateTime.now().set({ day: 12 }).toFormat('yyyy-LL-dd')
    },
    {
      title: 'Multi2',
      endDate: DateTime.now().set({ day: 27 }).toFormat('yyyy-LL-dd'),
      startDate: DateTime.now().set({ day: 24 }).toFormat('yyyy-LL-dd')
    },
    {
      title: 'Single',
      date: DateTime.now().set({ day: 19 }).toFormat('yyyy-LL-dd')
    }
  ]

  clndr.multidayMixed = $('#multiday-mixed').clndr({
    events: multidayMixedArray,
    multiDayEvents: {
      singleDay: 'date',
      endDate: 'endDate',
      startDate: 'startDate'
    },
    clickEvents: {
      click: function (target) {
        console.log(target)
      }
    }
  })

  // Test multi-day event performance
  // =========================================================================
  // Start with two truly multiday events.
  multidayMixedPerfArray = [
    {
      title: 'Multi1',
      endDate: DateTime.now().set({ day: 17 }).toFormat('yyyy-LL-dd'),
      startDate: DateTime.now().set({ day: 12 }).toFormat('yyyy-LL-dd')
    },
    {
      title: 'Multi2',
      endDate: DateTime.now().set({ day: 27 }).toFormat('yyyy-LL-dd'),
      startDate: DateTime.now().set({ day: 24 }).toFormat('yyyy-LL-dd')
    }
  ]

  // Add ten events every day this month that are only a day long,
  // which triggers clndr to use a performance optimization.
  daysInMonth = DateTime.now().daysInMonth

  for (i = 1; i <= daysInMonth; i++) {
    padDay = i < 10 ? '0' + i : i

    for (j = 0; j < 10; j++) {
      multidayMixedPerfArray.push({
        endDate: DateTime.now().toFormat('yyyy-LL') + '-' + padDay,
        startDate: DateTime.now().toFormat('yyyy-LL') + '-' + padDay
      })
    }
  }

  // Start timer
  start = DateTime.now()

  clndr.multidayMixedPerformance = $('#multiday-mixed-performance').clndr({
    events: multidayMixedPerfArray,
    multiDayEvents: {
      singleDay: 'date',
      endDate: 'endDate',
      startDate: 'startDate'
    },
    clickEvents: {
      click: function (target) {
        console.log(target)
      }
    }
  })

  // Capture the end time
  performanceSeconds = (DateTime.now().toMillis() - start.toMillis()) / 1000

  $('#multiday-mixed-performance-val').text(performanceSeconds)

  // Test really long multi-day events
  // =========================================================================
  multidayLongArray = [
    {
      title: 'Multi1',
      endDate: DateTime.now().set({ day: 17 }).toFormat('yyyy-LL-dd'),
      startDate: DateTime.now().minus({ months: 3 }).toFormat('yyyy-LL') + '-12'
    },
    {
      title: 'Multi2',
      startDate: DateTime.now().set({ day: 24 }).toFormat('yyyy-LL-dd'),
      endDate: DateTime.now().plus({ months: 4 }).toFormat('yyyy-LL') + '-27'
    }
  ]

  clndr.multidayLong = $('#multiday-long').clndr({
    events: multidayLongArray,
    multiDayEvents: {
      endDate: 'endDate',
      startDate: 'startDate'
    },
    clickEvents: {
      click: function (target) {
        console.log(target)
      }
    }
  })

  // Test constraints
  // The 4th of this month to the 12th of next month
  // =========================================================================
  clndr.constraints = $('#constraints').clndr({
    constraints: {
      startDate: DateTime.now().toFormat('yyyy-LL') + '-04',
      endDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-12'
    },
    clickEvents: {
      click: function (target) {
        if ($(target.element).hasClass('inactive')) {
          console.log("You can't pick that date.")
        } else {
          console.log('You picked a valid date.')
        }
      }
    }
  })

  // Test constraints
  // The 22nd of previous month to the 5th of next month
  // =========================================================================
  clndr.prevNextMonthConstraints = $('#prev-next-month-constraints').clndr({
    constraints: {
      endDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-05',
      startDate: DateTime.now().minus({ months: 1 }).toFormat('yyyy-LL') + '-22'
    }
  })

  // Test constraints
  // The 2nd to the 5th of previous month
  // =========================================================================
  clndr.prevMonthConstraints = $('#prev-month-constraints').clndr({
    constraints: {
      endDate: DateTime.now().minus({ months: 1 }).toFormat('yyyy-LL') + '-05',
      startDate: DateTime.now().minus({ months: 1 }).toFormat('yyyy-LL') + '-02'
    }
  })

  // Test constraints
  // The 22nd to the 25th of next month
  // =========================================================================
  clndr.nextMonthConstraints = $('#next-month-constraints').clndr({
    constraints: {
      endDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-25',
      startDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-22'
    }
  })

  // Test the start constraint by itself (4th of this month)
  // =========================================================================
  clndr.startConstraint = $('#start-constraint').clndr({
    constraints: {
      startDate: DateTime.now().toFormat('yyyy-LL') + '-04'
    }
  })

  // Test the end constraint by itself (12th of next month)
  // =========================================================================
  clndr.endConstraint = $('#end-constraint').clndr({
    constraints: {
      endDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-12'
    }
  })

  // Test API
  // You could do this with any instance but this makes for a nice reminder
  // =========================================================================
  clndr.api = $('#api').clndr({
    clickEvents: {
      onMonthChange: function (month) {
        console.log('onMonthChange was called.', month)
      },
      onYearChange: function (month) {
        console.log('onYearChange was called.', month)
      }
    }
  })

  // Test forceSixRows option
  // =========================================================================
  clndr.sixRows = $('#six-rows').clndr({
    forceSixRows: true
  })

  // Test options.classes
  // =========================================================================
  clndr.customClasses = $('#custom-classes').clndr({
    events: eventsArray,
    classes: {
      past: 'my-past',
      today: 'my-today',
      event: 'my-event',
      inactive: 'my-inactive',
      lastMonth: 'my-last-month',
      nextMonth: 'my-next-month',
      adjacentMonth: 'my-adjacent-month'
    },
    clickEvents: {
      click: function (target) {
        console.log(target)
      }
    }
  })

  // Test lengthOfTime.months option (three month views in one)
  // =========================================================================
  clndr.threeMonths = $('#three-months').clndr({
    template: $('#clndr-multimonth-template').html(),
    lengthOfTime: {
      months: 3,
      interval: 1,
      startDate: DateTime.now()
        .minus({ months: 1 })
        .startOf('month')
        .toISODate()
    },
    clickEvents: {
      click: function (target) {
        console.log(target)
      },
      previousInterval: function (start, end) {
        console.log('previous interval:', start, end)
      },
      nextInterval: function (start, end) {
        console.log('next interval:', start, end)
      },
      onIntervalChange: function (start, end) {
        console.log('interval change:', start, end)
      }
    }
  })

  // Test lengthOfTime.months option (three month views in one)
  // =========================================================================
  clndr.threeMonthsWithEvents = $('#three-months-with-events').clndr({
    template: $('#clndr-multimonth-template').html(),
    events: multidayArray,
    lengthOfTime: {
      months: 3,
      interval: 1,
      startDate: DateTime.now()
        .minus({ months: 1 })
        .startOf('month')
        .toISODate()
    },
    multiDayEvents: {
      endDate: 'endDate',
      startDate: 'startDate'
    },
    clickEvents: {
      click: function (target) {
        console.log(target)
      },
      previousInterval: function (start, end) {
        console.log('previous interval:', start, end)
      },
      nextInterval: function (start, end) {
        console.log('next interval:', start, end)
      },
      onIntervalChange: function (start, end) {
        console.log('interval change:', start, end)
      }
    }
  })

  // Test lengthOfTime.months option (three month views in one)
  // =========================================================================
  clndr.threeMonthsWithContraints = $('#three-months-with-constraints').clndr({
    template: $('#clndr-multimonth-template').html(),
    events: multidayArray,
    lengthOfTime: {
      months: 3,
      interval: 1,
      startDate: DateTime.now()
        .minus({ months: 1 })
        .startOf('month')
        .toISODate()
    },
    multiDayEvents: {
      endDate: 'endDate',
      startDate: 'startDate'
    },
    clickEvents: {
      click: function (target) {
        console.log(target)
      },
      previousInterval: function (start, end) {
        console.log('previous interval:', start, end)
      },
      nextInterval: function (start, end) {
        console.log('next interval:', start, end)
      },
      onIntervalChange: function (start, end) {
        console.log('interval change:', start, end)
      }
    },
    constraints: {
      endDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-12',
      startDate: DateTime.now().minus({ months: 2 }).toISODate()
    }
  })

  // Test lengthOfTime.days option (14 days incremented by 7)
  // =========================================================================
  clndr.twoWeeks = $('#one-week').clndr({
    template: $('#clndr-oneweek-template').html(),
    lengthOfTime: {
      days: 14,
      interval: 7,
      startDate: DateTime.now().set({ weekday: 7 }).toISODate()
    }
  })

  // Test lengthOfTime.days option (14 days incremented by 7)
  // =========================================================================
  clndr.twoWeeksWithConstraints = $('#one-week-with-constraints').clndr({
    template: $('#clndr-oneweek-template').html(),
    events: multidayArray,
    multiDayEvents: {
      endDate: 'endDate',
      startDate: 'startDate'
    },
    lengthOfTime: {
      days: 14,
      interval: 7,
      startDate: DateTime.now().set({ weekday: 7 }).toISODate()
    },
    constraints: {
      startDate: DateTime.now().toFormat('yyyy-LL') + '-04',
      endDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-12'
    }
  })

  // Test lengthOfTime.days option with constraints (14 days incremented by 7)
  // The 2nd to the 5th of previous month
  // =========================================================================
  clndr.twoWeeksWithPrevMonthConstraints = $(
    '#one-week-with-prev-month-constraints'
  ).clndr({
    template: $('#clndr-oneweek-template').html(),
    lengthOfTime: {
      days: 14,
      interval: 7,
      startDate: DateTime.now().set({ weekday: 7 }).toISODate()
    },
    constraints: {
      endDate: DateTime.now().minus({ months: 1 }).toFormat('yyyy-LL') + '-05',
      startDate: DateTime.now().minus({ months: 1 }).toFormat('yyyy-LL') + '-02'
    }
  })

  // Test lengthOfTime.days option with constraints (14 days incremented by 7)
  // The 22nd to the 25th of next month
  // =========================================================================
  clndr.twoWeeksWithNextMonthConstraints = $(
    '#one-week-with-next-month-constraints'
  ).clndr({
    template: $('#clndr-oneweek-template').html(),
    lengthOfTime: {
      days: 14,
      interval: 7,
      startDate: DateTime.now().set({ weekday: 7 }).toISODate()
    },
    constraints: {
      endDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-25',
      startDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-22'
    }
  })

  // Test selectedDate option
  // =========================================================================
  clndr.selectedDate = $('#selected-date').clndr({
    trackSelectedDate: true,
    template: $('#clndr-template').html()
  })

  // Test selectedDate option with ignoreInactiveDaysInSelection
  // =========================================================================
  clndr.selectedDateIgnoreInactive = $('#selected-date-ignore-inactive').clndr({
    template: $('#clndr-template').html(),
    trackSelectedDate: true,
    ignoreInactiveDaysInSelection: true,
    constraints: {
      endDate: DateTime.now().plus({ months: 1 }).toFormat('yyyy-LL') + '-12',
      startDate: DateTime.now().minus({ months: 1 }).toISODate()
    }
  })

  // Test weekOffset option
  // =========================================================================
  clndr.weekOffset = $('#week-offset').clndr({
    template: $('#clndr-oneweek-template').html(),
    weekOffset: 5,
    lengthOfTime: {
      days: 28,
      interval: 28,
      startDate: DateTime.now().set({ weekday: 5 }).toISODate()
    }
  })

  // Test invalid weekOffset option
  // =========================================================================
  clndr.weekOffsetInvalid = $('#week-offset-invalid').clndr({
    template: $('#clndr-oneweek-template').html(),
    weekOffset: 7,
    lengthOfTime: {
      days: 28,
      interval: 28,
      startDate: DateTime.now().set({ weekday: 5 }).toISODate()
    }
  })

  // Test selectedDate option with adjacentDaysChangeMonth
  // =========================================================================
  clndr.selectedDateAdjacentDays = $('#selected-date-adjacent-days').clndr({
    trackSelectedDate: true,
    showAdjacentMonths: true,
    adjacentDaysChangeMonth: true,
    template: $('#clndr-template').html()
  })

  // Test custom targets.day option with constraints (#330)
  // =========================================================================
  clndr.constraintsCustomDayTarget = $('#constraints-custom-day-target').clndr({
    targets: {
      day: 'my-day'
    },
    constraints: {
      startDate: DateTime.now().minus({ months: 1 }).toISODate(),
      endDate: DateTime.now().plus({ months: 1 }).toISODate()
    },
    template: $('#clndr-template').html()
  })

  // Test formatWeekdayHeader option (#342)
  // =========================================================================
  clndr.formatWeekdayHeader = $('#format-weekday-header').clndr({
    formatWeekdayHeader: function (day) {
      // day is a Luxon DateTime from the adapter
      return day && day.toFormat ? day.toFormat('cccc') : String(day)
    }
  })
})
