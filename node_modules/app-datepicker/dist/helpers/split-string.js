export function splitString(dateString, cb) {
    const dateList = typeof dateString === 'string' && dateString.length > 0
        ? dateString.split(/,\s*/i)
        : [];
    if (!dateList.length)
        return [];
    return typeof cb === 'function' ? dateList.map(cb) : dateList;
}
