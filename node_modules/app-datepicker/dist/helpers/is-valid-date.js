export function isValidDate(date, dateDate) {
    return !(date == null || !(dateDate instanceof Date) || isNaN(+dateDate));
}
