export function findShadowTarget(ev, callback) {
    return ev.composedPath().find((n) => {
        if (n instanceof HTMLElement)
            return callback(n);
        return false;
    });
}
