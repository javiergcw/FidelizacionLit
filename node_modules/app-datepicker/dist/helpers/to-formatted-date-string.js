export function toFormattedDateString(date) {
    if (date instanceof Date && !isNaN(+date)) {
        const dateString = date.toJSON();
        return dateString == null ? '' : dateString.replace(/^(.+)T.+/i, '$1');
    }
    return '';
}
