import './custom_typings.js';
export const INTL_DATE_TIME_FORMAT = Intl && Intl.DateTimeFormat;
const UP_KEYS = [
    38,
    33,
    36,
];
const DOWN_KEYS = [
    40,
    34,
    35,
];
export const PREV_KEY_CODES_SET = new Set([37, ...UP_KEYS]);
export const NEXT_KEY_CODES_SET = new Set([39, ...DOWN_KEYS]);
export const NEXT_DAY_KEY_CODES_SET = new Set([39, ...UP_KEYS]);
export const PREV_DAY_KEY_CODES_SET = new Set([37, ...DOWN_KEYS]);
export const ALL_NAV_KEYS_SET = new Set([
    37,
    39,
    ...UP_KEYS,
    ...DOWN_KEYS,
]);
export const DATEPICKER_NAME = 'app-datepicker';
export const DATEPICKER_DIALOG_NAME = 'app-datepicker-dialog';
