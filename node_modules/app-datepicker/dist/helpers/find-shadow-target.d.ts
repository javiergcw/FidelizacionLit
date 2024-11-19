declare type AnyEventType = CustomEvent | KeyboardEvent | MouseEvent | PointerEvent;
export declare function findShadowTarget<T extends HTMLElement = HTMLElement>(ev: AnyEventType, callback: (n: HTMLElement) => boolean): T;
export {};
//# sourceMappingURL=find-shadow-target.d.ts.map