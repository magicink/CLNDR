// Call this from the developer console and you can control both instances
var calendars = {};
var TPL_CAL = null;
var TPL_CAL_MONTHS = null;

function destroyAll() {
    try { calendars.clndr1 && calendars.clndr1.destroy && calendars.clndr1.destroy(); } catch (e) {}
    try { calendars.clndr2 && calendars.clndr2.destroy && calendars.clndr2.destroy(); } catch (e) {}
    try { calendars.clndr3 && calendars.clndr3.destroy && calendars.clndr3.destroy(); } catch (e) {}
}

function initCalendars(opts) {
    var dateLibrary = 'luxon';
    var locale = (opts && opts.locale) || 'en';
    var directClndr = window.clndr && (window.clndr.clndr || window.clndr);

    // Ensure Luxon locale is used implicitly by CLNDR via options.

    // Here's some magic to make sure the dates are happening this month.
    var thisMonth = (window.luxon && window.luxon.DateTime.now().toFormat('yyyy-MM')) || (new Date().toISOString().slice(0,7));
    // Events to load into calendar
    var eventArray = [
        {
            title: 'Multi-Day Event',
            endDate: thisMonth + '-14',
            startDate: thisMonth + '-10'
        }, {
            endDate: thisMonth + '-23',
            startDate: thisMonth + '-21',
            title: 'Another Multi-Day Event'
        }, {
            date: thisMonth + '-27',
            title: 'Single Day Event'
        }
    ];

    // Calendar 1 uses the jQuery plugin API for backward compatibility
    calendars.clndr1 = $('.cal1').clndr({
        dateLibrary: dateLibrary,
        locale: locale,
        events: eventArray,
        clickEvents: {
            click: function (target) {
                console.log('Cal-1 clicked: ', target);
            },
            today: function () {
                console.log('Cal-1 today');
            },
            nextMonth: function () {
                console.log('Cal-1 next month');
            },
            previousMonth: function () {
                console.log('Cal-1 previous month');
            },
            onMonthChange: function () {
                console.log('Cal-1 month changed');
            },
            nextYear: function () {
                console.log('Cal-1 next year');
            },
            previousYear: function () {
                console.log('Cal-1 previous year');
            },
            onYearChange: function () {
                console.log('Cal-1 year changed');
            },
            nextInterval: function () {
                console.log('Cal-1 next interval');
            },
            previousInterval: function () {
                console.log('Cal-1 previous interval');
            },
            onIntervalChange: function () {
                console.log('Cal-1 interval changed');
            }
        },
        multiDayEvents: {
            singleDay: 'date',
            endDate: 'endDate',
            startDate: 'startDate'
        },
        showAdjacentMonths: true,
        adjacentDaysChangeMonth: false
    });

    // Calendar 2 uses a custom length of time: 2 weeks paging 7 days
    var calendarTwoFactory = directClndr || function (selector, options) {
        return $(selector).clndr(options);
    };

    calendars.clndr2 = calendarTwoFactory('.cal2', {
        dateLibrary: dateLibrary,
        locale: locale,
        lengthOfTime: {
            days: 14,
            interval: 7
        },
        events: eventArray,
        multiDayEvents: {
            singleDay: 'date',
            endDate: 'endDate',
            startDate: 'startDate'
        },
        template: TPL_CAL,
        clickEvents: {
            click: function (target) {
                console.log('Cal-2 clicked: ', target);
            },
            nextInterval: function () {
                console.log('Cal-2 next interval');
            },
            previousInterval: function () {
                console.log('Cal-2 previous interval');
            },
            onIntervalChange: function () {
                console.log('Cal-2 interval changed');
            }
        }
    });

    // Calendar 3 renders two months at a time, paging 1 month
    calendars.clndr3 = calendarTwoFactory('.cal3', {
        dateLibrary: dateLibrary,
        locale: locale,
        lengthOfTime: {
            months: 2,
            interval: 1
        },
        events: eventArray,
        multiDayEvents: {
            endDate: 'endDate',
            startDate: 'startDate'
        },
        clickEvents: {
            click: function (target) {
                console.log('Cal-3 clicked: ', target);
            },
            nextInterval: function () {
                console.log('Cal-3 next interval');
            },
            previousInterval: function () {
                console.log('Cal-3 previous interval');
            },
            onIntervalChange: function () {
                console.log('Cal-3 interval changed');
            }
        },
        template: TPL_CAL_MONTHS
    });
}

$(document).ready( function() {
    console.info(
        'Welcome to the CLNDR demo. Click around on the calendars and' +
        'the console will log different events that fire.');

    // Assuming you've got the appropriate language files,
    // clndr will respect whatever moment's language is set to.
    // moment.locale('ru');

    // Cache templates once; templates are placed outside calendar containers
    TPL_CAL = $('#template-calendar').html();
    TPL_CAL_MONTHS = $('#template-calendar-months').html();

    // Initialize calendars with defaults (Phase 9: Luxon default)
    initCalendars({ locale: 'en' });

    // Hook up UI toggles
    // Date library is fixed to Luxon in this build.
    $('#locale').on('change', function () {
        var loc = $(this).val();
        destroyAll();
        initCalendars({ locale: loc });
    });

    // The order of the click handlers is predictable. Direct click action
    // callbacks come first: click, nextMonth, previousMonth, nextYear,
    // previousYear, nextInterval, previousInterval, or today. Then
    // onMonthChange (if the month changed), inIntervalChange if the interval
    // has changed, and finally onYearChange (if the year changed).
    // Bind all clndrs to the left and right arrow keys
    $(document).keydown( function(e) {
        // Left arrow
        if (e.keyCode == 37) {
            calendars.clndr1.back();
            calendars.clndr2.back();
            calendars.clndr3.back();
        }

        // Right arrow
        if (e.keyCode == 39) {
            calendars.clndr1.forward();
            calendars.clndr2.forward();
            calendars.clndr3.forward();
        }
    });
});
