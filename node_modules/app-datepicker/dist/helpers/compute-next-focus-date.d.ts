interface ParamsComputeNextFocusedDate {
    hasAltKey: boolean;
    keyCode: KeyboardEvent['keyCode'];
    focusedDate: Date;
    selectedDate: Date;
    disabledDaysSet: Set<number>;
    disabledDatesSet: Set<number>;
    minTime: number;
    maxTime: number;
}
export declare function computeNextFocusedDate({ hasAltKey, keyCode, focusedDate, selectedDate, disabledDaysSet, disabledDatesSet, minTime, maxTime, }: ParamsComputeNextFocusedDate): Date;
export {};
//# sourceMappingURL=compute-next-focus-date.d.ts.map