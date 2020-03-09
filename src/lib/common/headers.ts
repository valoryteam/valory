import {Map} from "./util";
import {ApiResponse} from "./response";
import {ApiRequest} from "./request";
import {AttachmentRegistry} from "./attachment-registry";

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
