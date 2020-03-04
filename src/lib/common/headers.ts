import {Map} from "./util";
import {ApiResponse} from "./response";
import {ApiRequest} from "./request";
import {AttachmentRegistry} from "./attachment-registry";

export type HttpMethod =
    "POST" |
    "PUT" |
    "PATCH" |
    "DELETE" |
    "GET" |
    "HEAD" |
    "OPTIONS";

export type HttpMethodLowercase =
    "post" |
    "put" |
    "patch" |
    "delete" |
    "get" |
    "head" |
    "options";

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

export interface ApiExchange {
    headers: Map<any>;
    body: any;
}
