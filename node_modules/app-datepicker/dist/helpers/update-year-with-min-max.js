export function updateYearWithMinMax(date, min, max) {
    const dateTime = typeof date === 'number' ? date : +date;
    const minTime = +min;
    const maxTime = +max;
    if (dateTime < minTime)
        return minTime;
    if (dateTime > maxTime)
        return maxTime;
    return date;
}
