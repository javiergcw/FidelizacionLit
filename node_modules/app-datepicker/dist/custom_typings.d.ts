import type { DateTimeFormatter } from 'nodemod/dist/calendar/calendar_typing.js';
export declare type Nullable<T> = {
    [P in keyof T]: T[P] | null;
};
declare type HTMLButtonElementPart = 'calendar-selector' | 'month-selector' | 'year-selector' | 'year';
declare type HTMLDivElementPart = 'actions' | 'body' | 'calendar-view' | 'calendar' | 'calendars' | 'day' | 'dialog-content' | 'header' | 'label' | 'month-selectors' | 'scrim' | 'toolbar' | 'weekday' | 'year-list-view' | 'year-list';
declare type HTMLElementMWCButtonPart = 'clear' | 'confirm' | 'dismiss';
declare type HTMLTableCellElementPart = 'calendar-day' | 'calendar-weekday';
declare type HTMLTableElementPart = 'table';
declare type HTMLTableRowElementPart = 'weekdays';
export declare type HTMLElementPart = HTMLButtonElementPart | HTMLDivElementPart | HTMLElementMWCButtonPart | HTMLTableCellElementPart | HTMLTableElementPart | HTMLTableRowElementPart;
export declare type StartView = 'calendar' | 'yearList';
export declare type MonthUpdateType = 'previous' | 'next';
export interface Formatters {
    dayFormat: DateTimeFormatter;
    fullDateFormat: DateTimeFormatter;
    longWeekdayFormat: DateTimeFormatter;
    narrowWeekdayFormat: DateTimeFormatter;
    longMonthYearFormat: DateTimeFormatter;
    dateFormat: DateTimeFormatter;
    yearFormat: DateTimeFormatter;
    locale: string;
}
export declare const enum KEY_CODES_MAP {
    ESCAPE = 27,
    SHIFT = 16,
    TAB = 9,
    ENTER = 13,
    SPACE = 32,
    PAGE_UP = 33,
    PAGE_DOWN = 34,
    END = 35,
    HOME = 36,
    ARROW_LEFT = 37,
    ARROW_UP = 38,
    ARROW_RIGHT = 39,
    ARROW_DOWN = 40
}
export interface FocusTrap {
    disconnect(): void;
}
export interface DatepickerValueUpdated {
    isKeypress: boolean;
    keyCode?: KEY_CODES_MAP;
    value: string;
}
export interface DatepickerFirstUpdated extends Pick<DatepickerValueUpdated, 'value'> {
    firstFocusableElement: HTMLElement;
}
export {};
//# sourceMappingURL=custom_typings.d.ts.map