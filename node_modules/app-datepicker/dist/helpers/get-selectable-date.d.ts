interface ParamsGetNextSelectableDate {
    keyCode: KeyboardEvent['keyCode'];
    disabledDaysSet: Set<number>;
    disabledDatesSet: Set<number>;
    focusedDate: Date;
    maxTime: number;
    minTime: number;
}
export declare function getNextSelectableDate({ keyCode, disabledDaysSet, disabledDatesSet, focusedDate, maxTime, minTime, }: ParamsGetNextSelectableDate): Date;
export {};
//# sourceMappingURL=get-selectable-date.d.ts.map