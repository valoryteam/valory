import { Swagger } from "./swagger";
import { Logger } from "pino";
import { AttachmentKey } from "./request";
import { ApiHandler, ApiMiddleware, ApiResponse, ApiServer, ErrorDef, ErrorFormatter, HttpMethod } from "./valoryheaders";
export interface ValoryOptions {
    info: Swagger.Info;
    server: ApiServer;
    errors?: {
        [x: string]: ErrorDef;
    };
    consumes?: string[];
    produces?: string[];
    parameters?: {
        [name: string]: Swagger.Parameter;
    };
    responses?: {
        [name: string]: Swagger.Response;
    };
    definitions?: {
        [x: string]: Swagger.Schema;
    };
    tags?: Swagger.Tag[];
    basePath?: string;
}
export declare class Valory {
    server: ApiServer;
    static ValidationResultKey: AttachmentKey<true | string[] | string>;
    static RequestIDKey: AttachmentKey<string>;
    static ResponseKey: AttachmentKey<ApiResponse>;
    /**
     * Create the Valory instance
     */
    static createInstance(options: ValoryOptions): Valory;
    /**
     * Get the valory instance
     */
    static getInstance(): Valory;
    private static instance;
    private static directInstantiation;
    Logger: Logger;
    private COMPILERMODE;
    private TESTMODE;
    private errorFormatter;
    private globalMiddleware;
    private globalPostMiddleware;
    private apiDef;
    private validatorModule;
    private errors;
    private registerGeneratedRoutes;
    private metadata;
    /**
     * @deprecated use [[Valory.createInstance]] instead
     */
    constructor(info: Swagger.Info, errors: {
        [x: string]: ErrorDef;
    }, consumes: string[], produces: string[], definitions: {
        [x: string]: Swagger.Schema;
    }, tags: Swagger.Tag[], server: ApiServer, basePath?: string, parameters?: {
        [name: string]: Swagger.Parameter;
    }, responses?: {
        [name: string]: Swagger.Response;
    });
    /**
     * Register an endpoint with a given method
     */
    endpoint(path: string, method: HttpMethod, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware?: ApiMiddleware[], documented?: boolean, postMiddleware?: ApiMiddleware[]): void;
    /**
     * Override the default error formatter
     */
    setErrorFormatter(formatter: ErrorFormatter): void;
    /**
     * Build an ApiExchange from either an error name or an ErrorDef
     */
    buildError(error: string | ErrorDef, message?: string | string[]): ApiResponse;
    /**
     * Convenience method to build a return exchange when only body and/or header customization is required
     */
    buildSuccess(body: any, headers?: {
        [key: string]: any;
    }): ApiResponse;
    /**
     * Register GET endpoint
     */
    get(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware?: ApiMiddleware[], documented?: boolean, postMiddleware?: ApiMiddleware[]): void;
    /**
     * Register POST endpoint
     */
    post(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware?: ApiMiddleware[], documented?: boolean, postMiddleware?: ApiMiddleware[]): void;
    /**
     * Register DELETE endpoint
     */
    delete(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware?: ApiMiddleware[], documented?: boolean, postMiddleware?: ApiMiddleware[]): void;
    /**
     * Register HEAD endpoint
     */
    head(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware?: ApiMiddleware[], documented?: boolean, postMiddleware?: ApiMiddleware[]): void;
    /**
     * Register PATCH endpoint
     */
    patch(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware?: ApiMiddleware[], documented?: boolean, postMiddleware?: ApiMiddleware[]): void;
    /**
     * Register PUT endpoint
     */
    put(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware?: ApiMiddleware[], documented?: boolean, postMiddleware?: ApiMiddleware[]): void;
    /**
     * Register a global middleware run before every endpoint
     */
    addGlobalMiddleware(middleware: ApiMiddleware): void;
    /**
     * Register a global post middleware run after every endpoint
     */
    addGlobalPostMiddleware(middleware: ApiMiddleware): void;
    /**
     * Start server. Call once all endpoints are registered.
     */
    start(options: any): any;
    /**
     * Shuts down the server core
     */
    shutdown(): void;
    private endpointCompile;
    private endpointRun;
    private registerDocSite;
}
