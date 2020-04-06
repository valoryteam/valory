import {ApiResponse} from "./response";
import {ApiRequest} from "./request";
import {AttachmentRegistry} from "./attachment-registry";
import uuid = require("uuid-random");
import {lowercaseKeys} from "./util";
import qs = require("querystring");

export type ContentTypeParser = (input: string) => any;
export type ContentTypeSerializer = (input: unknown) => string;

const NOOP_STRING: ContentTypeSerializer = input => (input.toString());

export class ApiContext {
    public static defaultContentType = "application/json";
    private static parserMap: {[type: string]: ContentTypeParser} = {
        "application/json": JSON.parse,
        "application/x-www-form-urlencoded": qs.parse
    };
    private static serializerMap: {[type: string]: ContentTypeSerializer} = {
        "application/json": JSON.stringify,
        "application/x-www-form-urlencoded": qs.stringify
    };

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
    public readonly requestId = uuid();
    public readonly request: ApiRequest;

    constructor(request: Omit<ApiRequest, "body" | "formData">) {
        const headers = lowercaseKeys(request.headers);
        const contentType = request.headers["content-type"] || ApiContext.defaultContentType;
        const body = ApiContext.parse(contentType, request.rawBody);
        this.request = {
            formData: body,
            body,
            headers,
            path: request.path,
            method: request.method,
            rawBody: request.rawBody,
            pathParams: request.pathParams,
            queryParams: request.queryParams
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

    public responseContentType() {
        return this.response.headers["content-type"] || ApiContext.defaultContentType;
    }

    public serializeResponse() {
        const contentType = this.responseContentType();
        if (this.response.body == null) {return "";}
        return ApiContext.serialize(contentType, this.response.body);
    }
}
