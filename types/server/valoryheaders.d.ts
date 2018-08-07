import { ApiRequest } from "./request";
import { Swagger } from "./swagger";
import { Logger } from "pino";
/** @hidden */ export declare const VALORYLOGGERVAR = "LOGLEVEL";
/** @hidden */ export declare const VALORYPRETTYLOGGERVAR = "PRETTYLOG";
/** @hidden */ export declare const VALORYMETAVAR = "VALORY_METATDATA";
export declare type ErrorFormatter = (error: ErrorDef, message?: string | string[]) => ApiResponse;
export interface ApiExchange {
    headers: {
        [key: string]: any;
    };
    body: any;
}
export interface ApiResponse extends ApiExchange {
    statusCode: number;
}
export declare type ApiMiddlewareHandler = (req: ApiRequest, logger: Logger, done: (error?: ApiResponse) => void) => void;
export interface ApiMiddleware {
    tag?: Array<Swagger.Tag | string> | Swagger.Tag | string;
    name: string;
    handler: ApiMiddlewareHandler;
}
export interface ErrorDef {
    statusCode: number;
    errorCode: number;
    defaultMessage: string;
}
export interface RequestContext {
    requestId: string;
}
export declare type ApiHandler = (request: ApiRequest, logger: Logger, requestContext: RequestContext) => Promise<ApiResponse> | ApiResponse;
export declare enum HttpMethod {
    POST = 0,
    PUT = 1,
    GET = 2,
    DELETE = 3,
    HEAD = 4,
    PATCH = 5
}
export interface ApiServer {
    locallyRunnable: boolean;
    register: (path: string, method: HttpMethod, handler: (request: ApiRequest) => ApiResponse | Promise<ApiResponse>) => void;
    allowDocSite: boolean;
    getExport: (metadata: ValoryMetadata, options: any) => {
        valory: ValoryMetadata;
    };
    shutdown: () => void;
}
export interface ValoryMetadata {
    undocumentedEndpoints: string[];
    valoryPath: string;
    compiledSwaggerPath: string;
    swagger: Swagger.Spec;
}
