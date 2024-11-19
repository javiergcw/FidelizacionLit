export function passiveHandler(cb) {
    return { passive: true, handleEvent: cb };
}
