import { toUTCDate } from 'nodemod/dist/calendar/helpers/to-utc-date.js';
export function getResolvedDate(date) {
    const dateDate = date == null ? new Date() : new Date(date);
    const isUTCDateFormat = typeof date === 'string' && (/^\d{4}-\d{2}-\d{2}$/i.test(date) ||
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(Z|\+00:00|-00:00)$/i.test(date));
    const isUnixTimestamp = typeof date === 'number' && date > 0 && isFinite(date);
    let fy = dateDate.getFullYear();
    let m = dateDate.getMonth();
    let d = dateDate.getDate();
    if (isUTCDateFormat || isUnixTimestamp) {
        fy = dateDate.getUTCFullYear();
        m = dateDate.getUTCMonth();
        d = dateDate.getUTCDate();
    }
    return toUTCDate(fy, m, d);
}
