export declare function fastConcat<T>(...arrays: T[][]): T[];
export declare function fastForEach<T>(subject: T[], fn: (item: T, index: number, subject: T[]) => void, thisContext: any): void;
export declare function bindInternal3<A, B, C>(func: (a: A, b: B, c: C) => any, thisContext: any): (a: A, b: B, c: C) => any;
export declare function convertTime(time: [number, number]): number;
export declare function spinnerFail(message: string, e: any): Promise<void>;
