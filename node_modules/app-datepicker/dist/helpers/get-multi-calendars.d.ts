import type { Calendar, CalendarWeekday, DateTimeFormatter, WeekNumberType } from 'nodemod/dist/calendar/calendar_typing.js';
interface MultiCalendars extends NonNullable<Omit<Calendar, 'calendar' | 'key'>> {
    key: string;
    weekdays: CalendarWeekday[];
    calendars: Pick<Calendar, 'calendar' | 'key'>[];
}
interface GetMultiCalendarsOption {
    dayFormat: DateTimeFormatter;
    fullDateFormat: DateTimeFormatter;
    locale: string;
    longWeekdayFormat: DateTimeFormatter;
    narrowWeekdayFormat: DateTimeFormatter;
    selectedDate: Date;
    disabledDates?: Date[];
    disabledDays?: number[];
    firstDayOfWeek?: number;
    max?: Date;
    min?: Date;
    showWeekNumber?: boolean;
    weekLabel?: string;
    weekNumberType?: WeekNumberType;
}
export declare function getMultiCalendars(options: GetMultiCalendarsOption): MultiCalendars;
export {};
//# sourceMappingURL=get-multi-calendars.d.ts.map