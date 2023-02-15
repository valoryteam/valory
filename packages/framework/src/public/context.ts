import {v4} from 'uuid';
import { ApiRequest, ApiResponse, HttpHeaders } from '../public/types.js'
import { AttachmentRegistry } from './attachment-registry.js';
import { lowercaseKeys } from '../runtime/index.js';

export type ContentTypeParser = (input: string) => any;
export type ContentTypeSerializer = (input: {toString: () => string}) => string | Buffer;

const NOOP_STRING: ContentTypeSerializer = input => (input.toString());

export class ApiContext {
    public static defaultContentType = "application/json";
    public static requestIdGenerator: () => string = v4;
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
    private serializedResponse?: string | Buffer;

    constructor(request: Omit<ApiRequest, "body" | "formData" | "queryParams" | "path"> & {path: string, queryString: string, requestId?: string}) {
        const headers = lowercaseKeys(request.headers);
        const contentType = request.headers["content-type"] || ApiContext.defaultContentType;
        const body = ApiContext.parse(ApiContext.parseContentTypeHeader(contentType), request.rawBody);
        this.requestId = request.requestId || ApiContext.requestIdGenerator();
        this.request = {
            formData: body,
            body,
            headers,
            path: request.path,
            method: request.method,
            rawBody: request.rawBody,
            pathParams: request.pathParams || {},
            queryParams: ApiContext.parse("application/x-www-form-urlencoded", request.queryString) || {}
        };
    }

    private static parseContentTypeHeader(contentType: string | string[] | undefined): string {
        if (contentType == null) {
            return ApiContext.defaultContentType;
        }
        if (Array.isArray(contentType)) {
            return ApiContext.defaultContentType;
        }
        return contentType;
    }
    private static parse(contentType: string = ApiContext.defaultContentType, input: string) {
        if (input === "" || input == null) {
            return undefined;
        }

        try {
            return (ApiContext.parserMap[contentType] || NOOP_STRING)(input);
        } catch (e) {
            return input;
        }
    }

    private static serialize(contentType: string = ApiContext.defaultContentType, input: Object) {
        try {
            return (ApiContext.serializerMap[contentType] || NOOP_STRING)(input);
        } catch (e) {
            return input.toString();
        }
    }

    public prepareHeaders(): HttpHeaders {
        const headers = this.response.headers;
        headers["content-type"] = this.responseContentType();
        headers["content-length"] = Buffer.byteLength(this.serializeResponse()).toString();
        return headers;
    }

    public responseContentType() {
        return this.response.headers["content-type"] || ApiContext.defaultContentType;
    }

    public serializeResponse(): string | Buffer {
        if (this.response.body == null) {return "";}
        if (this.serializedResponse) {
            return this.serializedResponse;
        }
        const contentType = this.responseContentType();
        this.serializedResponse = ApiContext.serialize(ApiContext.parseContentTypeHeader(contentType), this.response.body);
        return this.serializedResponse as string | Buffer;
    }
}
