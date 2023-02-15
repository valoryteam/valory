import { OpenAPIV3_1 } from 'openapi-types'
import { ApiContext } from './context.js';
import { AttachmentRegistry, IAttachmentKey } from './attachment-registry.js';

export type ApiMiddlewareExecutor = (ctx: ApiContext) => Promise<void> | void;

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
export interface ApiResponse extends ApiExchange {
  statusCode: number;
}

export interface ApiRequest extends ApiExchange {
  rawBody: any;
  formData: HttpFormData;
  queryParams: HttpQueryParams;
  pathParams: HttpPathParams;
  path: string;
  method: HttpMethod;
}
export interface ApiMiddleware {
  readonly handler: ApiMiddlewareExecutor;
  readonly filter?: {
    readonly mustInclude?: IAttachmentKey<any>[],
    readonly mustExclude?: IAttachmentKey<any>[]
  };
  readonly name: string;
  readonly tags?: OpenAPIV3_1.TagObject[];
}

export interface ApiExchange {
  headers: HttpHeaders;
  body: HttpBody;
}

export type HttpHeaders = { [key: string]: string | string[] };
export type HttpQueryParams = {[key: string]: any};
export type HttpPathParams = { [key: string]: string | number };
export type HttpFormData = unknown;
export type HttpBody = unknown;

export const  ExceptionKey = AttachmentRegistry.createKey<Error>();
