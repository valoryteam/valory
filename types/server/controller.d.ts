import { Logger } from "pino";
export declare class Controller {
    logger: Logger;
    private statusCode;
    private headers;
    setStatus(statusCode: number): void;
    getStatus(): number;
    setHeader(name: string, value?: string): void;
    getHeader(name: string): string;
    getHeaders(): {
        [name: string]: string;
    };
    clearStatus(): void;
    clearHeaders(): void;
    buildError(error: string, message?: string): any;
}
