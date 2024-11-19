interface ParamUpdatedChanged extends Omit<Datepicker, keyof LitElement> {
    _selectedDate: Date;
    _focusedDate: Date;
    _startView: StartView;
}
import { LitElement, TemplateResult } from 'lit-element';
import type { WeekNumberType } from 'nodemod/dist/calendar/calendar_typing.js';
import type { DatepickerFirstUpdated, DatepickerValueUpdated, HTMLElementPart, StartView } from './custom_typings.js';
export declare class Datepicker extends LitElement {
    static styles: import("lit-element").CSSResult[];
    firstDayOfWeek: number;
    showWeekNumber: boolean;
    weekNumberType: WeekNumberType;
    landscape: boolean;
    get startView(): StartView;
    set startView(val: StartView);
    get min(): string;
    set min(val: string);
    get max(): string;
    set max(val: string);
    get value(): string;
    set value(val: string);
    locale: string;
    disabledDays: string;
    disabledDates: string;
    weekLabel: string;
    inline: boolean;
    dragRatio: number;
    get datepickerBodyCalendarView(): HTMLDivElement | null;
    get calendarsContainer(): HTMLDivElement | null;
    private _selectedDate;
    private _focusedDate;
    private _startView?;
    private _yearViewFullList?;
    private _buttonSelectorYear?;
    private _yearViewListItem?;
    private _min;
    private _max;
    private _hasMin;
    private _hasMax;
    private _todayDate;
    private _maxDate;
    private _yearList;
    private _formatters;
    private _disabledDaysSet;
    private _disabledDatesSet;
    private _lastSelectedDate?;
    private _tracker?;
    private _dx;
    private _hasNativeWebAnimation;
    private _updatingDateWithKey;
    constructor();
    disconnectedCallback(): void;
    protected render(): TemplateResult;
    protected firstUpdated(): void;
    protected updated(changed: Map<keyof ParamUpdatedChanged, unknown>): void;
    private _focusElement;
    private _renderHeaderSelectorButton;
    private _renderDatepickerYearList;
    private _renderDatepickerCalendar;
    private _updateView;
    private _updateMonth;
    private _updateYear;
    private _updateFocusedDate;
    private _updateFocusedDateWithKeyboard;
    private _isInVisibleMonth;
}
declare global {
    interface HTMLButtonElement {
        year: number;
    }
    interface HTMLElement {
        part: HTMLElementPart;
    }
    interface HTMLTableCellElement {
        day: string;
        fullDate: Date;
    }
    interface HTMLElementEventMap {
        'datepicker-first-updated': CustomEvent<DatepickerFirstUpdated>;
        'datepicker-animation-finished': CustomEvent<undefined>;
        'datepicker-value-updated': CustomEvent<DatepickerValueUpdated>;
    }
}
export {};
//# sourceMappingURL=datepicker.d.ts.map