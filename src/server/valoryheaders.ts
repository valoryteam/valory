import {ApiRequest} from "./request";
import {Swagger} from "./swagger";
import {Logger} from "pino";

/** @hidden */ export const VALORYLOGGERVAR = "LOGLEVEL";
/** @hidden */ export const VALORYPRETTYLOGGERVAR = "PRETTYLOG";
/** @hidden */ export const VALORYMETAVAR = "VALORY_METATDATA";
export type ErrorFormatter = (error: ErrorDef, message?: string | string[]) => ApiResponse;

export interface ApiExchange {
	headers: { [key: string]: any };
	body: any;
}

export interface ApiResponse extends ApiExchange {
	statusCode: number;
    disableSerializer?: boolean;
}

export type ApiMiddlewareHandler = (req: ApiRequest, logger: Logger,
									done: (error?: ApiResponse) => void) => void;

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

export type ApiHandler = (request: ApiRequest, logger: Logger, requestContext: RequestContext)
	=> Promise<ApiResponse> | ApiResponse;

export enum HttpMethod {
	POST,
	PUT,
	GET,
	DELETE,
	HEAD,
	PATCH,
}

export interface ApiServer {
	disableSerialization?: boolean;
	locallyRunnable: boolean;
	register: (path: string, method: HttpMethod, handler: (request: ApiRequest) =>
		ApiResponse | Promise<ApiResponse>) => void;
	allowDocSite: boolean;
	getExport: (metadata: ValoryMetadata, options: any) => { valory: ValoryMetadata };
	shutdown: () => void;
}

export interface ValoryMetadata {
	metadataVersion: number;
	undocumentedEndpoints: string[];
	disableSerialization: string[];
	valoryPath: string;
	compiledSwaggerPath: string;
	swagger: Swagger.Spec;
}
