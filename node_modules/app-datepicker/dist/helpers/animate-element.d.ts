interface AnimateElementOptions {
    hasNativeWebAnimation?: boolean;
    keyframes?: Keyframe[];
    options?: KeyframeAnimationOptions;
}
export declare function animateElement(node: HTMLElement, opts: AnimateElementOptions): Promise<void>;
export {};
//# sourceMappingURL=animate-element.d.ts.map