import { toUTCDate } from 'nodemod/dist/calendar/helpers/to-utc-date.js';
import { NEXT_KEY_CODES_SET, PREV_KEY_CODES_SET } from '../constants.js';
import '../custom_typings.js';
import { getNextSelectableDate } from './get-selectable-date.js';
export function computeNextFocusedDate({ hasAltKey, keyCode, focusedDate, selectedDate, disabledDaysSet, disabledDatesSet, minTime, maxTime, }) {
    const oldFy = focusedDate.getUTCFullYear();
    const oldM = focusedDate.getUTCMonth();
    const oldD = focusedDate.getUTCDate();
    const focusedDateTime = +focusedDate;
    const sdFy = selectedDate.getUTCFullYear();
    const sdM = selectedDate.getUTCMonth();
    const notInCurrentMonth = sdM !== oldM || sdFy !== oldFy;
    let fy = oldFy;
    let m = oldM;
    let d = oldD;
    let shouldRunSwitch = true;
    if (notInCurrentMonth) {
        fy = sdFy;
        m = sdM;
        d = 1;
        shouldRunSwitch =
            keyCode === 34 ||
                keyCode === 33 ||
                keyCode === 35;
    }
    switch (shouldRunSwitch) {
        case focusedDateTime === minTime && PREV_KEY_CODES_SET.has(keyCode):
        case focusedDateTime === maxTime && NEXT_KEY_CODES_SET.has(keyCode):
            break;
        case keyCode === 38: {
            d -= 7;
            break;
        }
        case keyCode === 40: {
            d += 7;
            break;
        }
        case keyCode === 37: {
            d -= 1;
            break;
        }
        case keyCode === 39: {
            d += 1;
            break;
        }
        case keyCode === 34: {
            hasAltKey ? fy += 1 : m += 1;
            break;
        }
        case keyCode === 33: {
            hasAltKey ? fy -= 1 : m -= 1;
            break;
        }
        case keyCode === 35: {
            m += 1;
            d = 0;
            break;
        }
        case keyCode === 36:
        default: {
            d = 1;
        }
    }
    if (keyCode === 34 || keyCode === 33) {
        const totalDaysOfMonth = toUTCDate(fy, m + 1, 0).getUTCDate();
        if (d > totalDaysOfMonth) {
            d = totalDaysOfMonth;
        }
    }
    const newFocusedDate = getNextSelectableDate({
        keyCode,
        maxTime,
        minTime,
        disabledDaysSet,
        disabledDatesSet,
        focusedDate: toUTCDate(fy, m, d),
    });
    return newFocusedDate;
}
