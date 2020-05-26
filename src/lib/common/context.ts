import {AttachmentRegistry} from "./attachment-registry";
import uuid = require("uuid-random");
import {lowercaseKeys} from "./util";
import qs = require("querystring");
import {ApiRequest, ApiResponse} from "./headers";
import url = require("url");

export type ContentTypeParser = (input: string) => any;
export type ContentTypeSerializer = (input: unknown) => string;

const NOOP_STRING: ContentTypeSerializer = input => (input.toString());

// Storage on global is required so that content handler registration can work while using CLI
if ((global as any).VALORY_CONTENT_HANDLER == null) {
    (global as any).VALORY_CONTENT_HANDLER = {
        parserMap: {
            "application/json": JSON.parse,
            "application/x-www-form-urlencoded": qs.parse
        },
        serializerMap: {
            "application/json": JSON.stringify,
            "application/x-www-form-urlencoded": qs.stringify
        }
    };
}

export class ApiContext {
    public static defaultContentType = "application/json";
    public static requestIdGenerator: () => string = uuid;
    private static parserMap: {[type: string]: ContentTypeParser} = (global as any).VALORY_CONTENT_HANDLER.parserMap;
    private static serializerMap: {[type: string]: ContentTypeSerializer} = (global as any).VALORY_CONTENT_HANDLER.serializerMap;

    public static registerParser(type: string, parser: ContentTypeParser) {
        ApiContext.parserMap[type] = parser;
    }

    public static registerSerializer(type: string, serializer: ContentTypeSerializer) {
        ApiContext.serializerMap[type] = serializer;
    }

    public response: ApiResponse = {
        body: {},
        headers: {},
        statusCode: 200
    };
    public readonly attachments = new AttachmentRegistry();
    public readonly requestId: string;
    public readonly request: ApiRequest;

    constructor(request: Omit<ApiRequest, "body" | "formData" | "queryParams" | "path"> & {path: string, query: string, requestId?: string}) {
        const headers = lowercaseKeys(request.headers);
        const contentType = request.headers["content-type"] || ApiContext.defaultContentType;
        const body = ApiContext.parse(contentType, request.rawBody);
        this.requestId = request.requestId || ApiContext.requestIdGenerator();
        this.request = {
            formData: body,
            body,
            headers,
            path: request.path,
            method: request.method,
            rawBody: request.rawBody,
            pathParams: request.pathParams,
            queryParams: ApiContext.parse("application/x-www-form-urlencoded", request.query)
        };
    }

    private static parse(contentType: string = ApiContext.defaultContentType, input: string) {
        try {
            return (ApiContext.parserMap[contentType] || NOOP_STRING)(input);
        } catch (e) {
            return input;
        }
    }

    private static serialize(contentType: string = ApiContext.defaultContentType, input: unknown) {
        try {
            return (ApiContext.serializerMap[contentType] || NOOP_STRING)(input);
        } catch (e) {
            return input.toString();
        }
    }

    public prepareHeaders(): {[name: string]: string} {
        const headers = this.response.headers;
        headers["content-type"] = headers["content-type"] || ApiContext.defaultContentType;
        return headers;
    }

    public responseContentType() {
        return this.response.headers["content-type"] || ApiContext.defaultContentType;
    }

    public serializeResponse() {
        const contentType = this.responseContentType();
        if (this.response.body == null) {return "";}
        return ApiContext.serialize(contentType, this.response.body);
    }
}
