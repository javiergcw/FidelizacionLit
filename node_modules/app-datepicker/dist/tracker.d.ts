declare type PointerType = MouseEvent | TouchEvent | PointerEvent | TouchInit;
interface ResolvedPointer {
    x: PointerEvent['pageX'];
    y: PointerEvent['pageY'];
    id: PointerEvent['pageY'] | Touch['identifier'];
}
export interface TrackerHandlers {
    down(startPointer: ResolvedPointer, ev: PointerType): void;
    move(startPointer: ResolvedPointer, oldPointer: ResolvedPointer, ev: PointerType): void;
    up(startPointer: ResolvedPointer, oldPointer: ResolvedPointer, ev: PointerType): void;
}
export declare class Tracker {
    private _element;
    private _startPointer;
    private readonly _down;
    private readonly _move;
    private readonly _up;
    constructor(_element: HTMLElement, handlers: TrackerHandlers);
    disconnect(): void;
    private _onDown;
    private _onMove;
    private _onUp;
    private _updatePointers;
}
export {};
//# sourceMappingURL=tracker.d.ts.map