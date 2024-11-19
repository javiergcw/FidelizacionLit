import '../custom_typings.js';
import { findShadowTarget } from './find-shadow-target.js';
export function setFocusTrap(target, focusableElements) {
    if (target == null || focusableElements == null)
        return null;
    const [firstEl, lastEl] = focusableElements;
    const keydownCallback = (ev) => {
        const isTabKey = ev.keyCode === 9;
        const isShiftTabKey = ev.shiftKey && isTabKey;
        if (!isTabKey && !isShiftTabKey)
            return;
        const isFocusingLastEl = findShadowTarget(ev, n => n.isEqualNode(lastEl)) != null;
        if (isFocusingLastEl && !isShiftTabKey) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            firstEl.focus();
            return;
        }
        const isFocusingFirstEl = findShadowTarget(ev, n => n.isEqualNode(firstEl)) != null;
        if (isFocusingFirstEl && isShiftTabKey) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            lastEl.shadowRoot.querySelector('button').focus();
        }
    };
    const disconnectCallback = () => {
        target.removeEventListener('keydown', keydownCallback);
    };
    target.addEventListener('keydown', keydownCallback);
    return { disconnect: disconnectCallback };
}
