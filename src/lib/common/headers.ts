import {Map} from "./util";
import {OpenAPIV3} from "openapi-types";
import {ApiContext} from "./context";

export type HttpMethod = typeof HttpMethods[number];

export type HttpMethodLowercase = typeof HttpMethodsLowercase[number];
    
export const HttpMethodsLowercase = [
    "post",
    "put",
    "patch",
    "delete",
    "get",
    "head",
    "options",
] as const;

export const HttpMethods = [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "GET",
    "HEAD",
    "OPTIONS",
] as const;

export function lowercaseHttpMethod(method: HttpMethod): HttpMethodLowercase {
    switch (method) {
        case "DELETE":
            return "delete";
        case "GET":
            return "get";
        case "HEAD":
            return "head";
        case "OPTIONS":
            return "options";
        case "PATCH":
            return "patch";
        case "POST":
            return "post";
        case "PUT":
            return "put";
    }
}

export function uppercaseHttpMethod(method: HttpMethodLowercase): HttpMethod {
    switch (method) {
        case "delete":
            return "DELETE";
        case "get":
            return "GET";
        case "head":
            return "HEAD";
        case "options":
            return "OPTIONS";
        case "patch":
            return "PATCH";
        case "post":
            return "POST";
        case "put":
            return "PUT";
    }
}

export interface ApiExchange {
    headers: Map<any>;
    body: any;
}

export const VALORY_METADATA_VAR = "VALORY_METADATA";
export const VALORY_DEFAULT_ADAPTOR_VAR = "VALORY_DEFAULT_ADAPTOR";
export const METADATA_VERSION = 2;
export const COMPSWAG_VERSION = 2;
export const ROUTES_VERSION = 2;
export const GLOBAL_ENTRY_KEY = "VALORY_DATA";

export interface ApiResponse extends ApiExchange {
    statusCode: number;
}

export interface ApiRequest extends ApiExchange {
    rawBody: any;
    formData: Map<any>;
    queryParams: Map<any>;
    pathParams: Map<any>;
    path: string;
    method: HttpMethod;
}

export type ApiMiddlewareExecutor = (ctx: ApiContext) => Promise<void> | void;

export interface ApiMiddleware {
    handler: ApiMiddlewareExecutor;
    readonly name: string;
    readonly tags?: OpenAPIV3.TagObject[];
}

export interface ApiAdaptor {
    register(path: string, method: HttpMethod, handler: (ctx: ApiContext) => Promise<ApiContext>): void;

    /**
     * Startup underlying server
     */
    start(): any;

    shutdown(): void;
}
