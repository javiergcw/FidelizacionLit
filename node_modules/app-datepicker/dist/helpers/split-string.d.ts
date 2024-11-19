declare type SplitStringFn<T> = (n: string, i: number, a: string[]) => T;
export declare function splitString(dateString: string): string[];
export declare function splitString<T>(dateString: string, cb: SplitStringFn<T>): T[];
export {};
//# sourceMappingURL=split-string.d.ts.map