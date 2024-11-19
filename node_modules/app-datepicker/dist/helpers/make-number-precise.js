export function makeNumberPrecise(num) {
    return (num - Math.floor(num)) > 0 ? +num.toFixed(3) : num;
}
