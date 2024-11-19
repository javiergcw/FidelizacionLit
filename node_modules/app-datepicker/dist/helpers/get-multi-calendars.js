import { getWeekdays } from 'nodemod/dist/calendar/helpers/get-weekdays.js';
import { toUTCDate } from 'nodemod/dist/calendar/helpers/to-utc-date.js';
import { calendar } from 'nodemod/dist/calendar/index.js';
export function getMultiCalendars(options) {
    const { dayFormat, fullDateFormat, locale, longWeekdayFormat, narrowWeekdayFormat, selectedDate, disabledDates, disabledDays, firstDayOfWeek, max, min, showWeekNumber, weekLabel, weekNumberType, } = options;
    const minTime = min == null ? Number.MIN_SAFE_INTEGER : +min;
    const maxTime = max == null ? Number.MAX_SAFE_INTEGER : +max;
    const weekdays = getWeekdays({
        longWeekdayFormat,
        narrowWeekdayFormat,
        firstDayOfWeek,
        showWeekNumber,
        weekLabel,
    });
    const getKey = (date) => [
        locale,
        date.toJSON(),
        disabledDates === null || disabledDates === void 0 ? void 0 : disabledDates.join('_'),
        disabledDays === null || disabledDays === void 0 ? void 0 : disabledDays.join('_'),
        firstDayOfWeek,
        max === null || max === void 0 ? void 0 : max.toJSON(),
        min === null || min === void 0 ? void 0 : min.toJSON(),
        showWeekNumber,
        weekLabel,
        weekNumberType,
    ].filter(Boolean).join(':');
    const ify = selectedDate.getUTCFullYear();
    const im = selectedDate.getUTCMonth();
    const calendarsList = [-1, 0, 1].map((n) => {
        const firstDayOfMonth = toUTCDate(ify, im + n, 1);
        const lastDayOfMonthTime = +toUTCDate(ify, im + n + 1, 0);
        const key = getKey(firstDayOfMonth);
        if (lastDayOfMonthTime < minTime || +firstDayOfMonth > maxTime) {
            return {
                key,
                calendar: [],
                disabledDatesSet: new Set(),
                disabledDaysSet: new Set(),
            };
        }
        const calendarDays = calendar({
            dayFormat,
            fullDateFormat,
            locale,
            disabledDates,
            disabledDays,
            firstDayOfWeek,
            max,
            min,
            showWeekNumber,
            weekNumberType,
            selectedDate: firstDayOfMonth,
        });
        return { ...calendarDays, key };
    });
    const calendars = [];
    const $disabledDatesSet = new Set();
    const $disabledDaysSet = new Set();
    for (const cal of calendarsList) {
        const { disabledDatesSet, disabledDaysSet, ...rest } = cal;
        if (rest.calendar.length > 0) {
            if (disabledDaysSet.size > 0) {
                for (const o of disabledDaysSet)
                    $disabledDaysSet.add(o);
            }
            if (disabledDatesSet.size > 0) {
                for (const o of disabledDatesSet)
                    $disabledDatesSet.add(o);
            }
        }
        calendars.push(rest);
    }
    return {
        calendars,
        weekdays,
        disabledDatesSet: $disabledDatesSet,
        disabledDaysSet: $disabledDaysSet,
        key: getKey(selectedDate),
    };
}
