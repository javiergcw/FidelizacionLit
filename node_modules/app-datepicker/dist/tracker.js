import { supportsPassiveEventListener } from '@material/mwc-base/utils.js';
function toPointer(ev) {
    const { clientX, clientY, pageX, pageY } = ev;
    const x = Math.max(pageX, clientX);
    const y = Math.max(pageY, clientY);
    const id = ev.identifier || ev.pointerId;
    return { x, y, id: id == null ? 0 : id };
}
function getFirstTouch(startPointer, ev) {
    const changedTouches = ev.changedTouches;
    if (changedTouches == null)
        return { newPointer: toPointer(ev), oldPointer: startPointer };
    const touches = Array.from(changedTouches, n => toPointer(n));
    const newPointer = startPointer == null
        ? touches[0]
        : touches.find(n => n.id === startPointer.id);
    return { newPointer, oldPointer: startPointer };
}
function addPassiveEventListener(node, event, callback) {
    node.addEventListener(event, callback, supportsPassiveEventListener ? { passive: true } : false);
}
export class Tracker {
    constructor(_element, handlers) {
        this._element = _element;
        this._startPointer = null;
        const { down, move, up } = handlers;
        this._down = this._onDown(down);
        this._move = this._onMove(move);
        this._up = this._onUp(up);
        if (_element && _element.addEventListener) {
            _element.addEventListener('mousedown', this._down);
            addPassiveEventListener(_element, 'touchstart', this._down);
            addPassiveEventListener(_element, 'touchmove', this._move);
            addPassiveEventListener(_element, 'touchend', this._up);
        }
    }
    disconnect() {
        const rootEl = this._element;
        if (rootEl && rootEl.removeEventListener) {
            rootEl.removeEventListener('mousedown', this._down);
            rootEl.removeEventListener('touchstart', this._down);
            rootEl.removeEventListener('touchmove', this._move);
            rootEl.removeEventListener('touchend', this._up);
        }
    }
    _onDown(down) {
        return (ev) => {
            if (ev instanceof MouseEvent) {
                this._element.addEventListener('mousemove', this._move);
                this._element.addEventListener('mouseup', this._up);
                this._element.addEventListener('mouseleave', this._up);
            }
            const { newPointer } = getFirstTouch(this._startPointer, ev);
            down(newPointer, ev);
            this._startPointer = newPointer;
        };
    }
    _onMove(move) {
        return (ev) => {
            this._updatePointers(move, ev);
        };
    }
    _onUp(up) {
        return (ev) => {
            this._updatePointers(up, ev, true);
        };
    }
    _updatePointers(cb, ev, shouldReset) {
        if (shouldReset && ev instanceof MouseEvent) {
            this._element.removeEventListener('mousemove', this._move);
            this._element.removeEventListener('mouseup', this._up);
            this._element.removeEventListener('mouseleave', this._up);
        }
        const { newPointer, oldPointer } = getFirstTouch(this._startPointer, ev);
        cb(newPointer, oldPointer, ev);
        this._startPointer = shouldReset ? null : newPointer;
    }
}
