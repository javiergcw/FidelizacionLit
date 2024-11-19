export function dispatchCustomEvent(target, eventName, detail) {
    return target.dispatchEvent(new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
    }));
}
