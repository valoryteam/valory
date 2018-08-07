import { ApiExchange } from "./valoryheaders";
export interface AttachmentKey<T> {
    readonly id: string;
    /** @hidden */ readonly marker: T;
}
export interface ApiRequestOptions {
    headers: {
        [key: string]: any;
    };
    body: any;
    rawBody: any;
    formData: {
        [key: string]: any;
    };
    query: {
        [key: string]: any;
    };
    path: {
        [key: string]: any;
    };
    route: string;
}
export declare class ApiRequest implements ApiExchange {
    static createKey<T>(): AttachmentKey<T>;
    headers: {
        [key: string]: any;
    };
    body: any;
    rawBody: any;
    formData: {
        [key: string]: any;
    };
    query: {
        [key: string]: any;
    };
    path: {
        [key: string]: any;
    };
    route: string;
    private attachments;
    constructor(options: ApiRequestOptions);
    putAttachment<T>(key: AttachmentKey<T>, value: T): void;
    getAttachment<T>(key: AttachmentKey<T>): T | null;
}
