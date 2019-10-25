import {ApiRequest} from "./request";
import {Swagger} from "./swagger";
import {Logger} from "pino";

/** @hidden */ export const VALORYLOGGERVAR = "LOGLEVEL";
/** @hidden */ export const VALORYPRETTYLOGGERVAR = "PRETTYLOG";
/** @hidden */ export const VALORYMETAVAR = "VALORY_METATDATA";

/**
 * Format an [[ApiResponse]] using an [[ErrorDef]] and an optional message. If desired, you can serialize the body to
 * a string while keeping the application/json content type, just remember to set [[ApiResponse.disableSerializer]]
 * on the response.
 */
export type ErrorFormatter = (error: ErrorDef, message?: string | string[]) => ApiResponse;

/**
 * Base type for [[ApiResponse]] and [[ApiRequest]]. Don't worry about this one.
 */
export interface ApiExchange {
	headers: { [key: string]: any };
	body: any;
}

/**
 * Provides a request level Pino logger given a parent logger and the [[RequestContext]]. You can use this to setup
 * custom log formatting.
 */
export type RequestLogProvider = (parent: Logger, requestContext: RequestContext) => Logger;

/**
 * Represents the response to an api call.
 */
export interface ApiResponse extends ApiExchange {
	statusCode: number;
	/**
	 * Whether or not to disable the generated request serializer.
	 */
    disableSerializer?: boolean;
}

/**
 * Processes incoming requests for middleware. If a response is returned in the callback, the current middleware chain
 * will be cancelled (is pre middleware, this will also cancel the normal response handler and skip to post middleware).
 */
export type ApiMiddlewareHandler = (req: ApiRequest, logger: Logger,
									done: (error?: ApiResponse) => void) => void;

/**
 * Represents a Middleware. Can be instantiated as a class or setup as an object literal.
 */
export interface ApiMiddleware {
	/**
	 * Can be used to add Swagger tags to attached endpoints.
	 */
	tag?: Array<Swagger.Tag | string> | Swagger.Tag | string;
	/**
	 * Name for the middleware. Mostly for logging purposes.
	 */
	name: string;
	handler: ApiMiddlewareHandler;
}

/**
 * Represents a reusable error type.
 */
export interface ErrorDef {
	/**
	 * HTTP status code to be set on the response
	 */
	statusCode: number;
	/**
	 * Unique code associated with this error
	 */
	errorCode: number;
	/**
	 * Default message to be returned
	 */
	defaultMessage: string;
}

/**
 * Contains basic contextual information for a request. Mostly used by the [[RequestLogProvider]].
 */
export interface RequestContext {
	requestId: string;
	requestIdName: string;
	route: string;
}

/**
 * The general request handler. This format only applies to the functional interface.
 */
export type ApiHandler = (request: ApiRequest, logger: Logger, requestContext: RequestContext)
	=> Promise<ApiResponse> | ApiResponse;

/**
 * HTTP methods supported by Valory.
 */
export enum HttpMethod {
	POST = "POST",
	PUT = "PUT",
	GET = "GET",
	DELETE = "DELETE",
	HEAD = "HEAD",
	PATCH = "PATCH",
	OPTIONS = "OPTIONS",
}

/**
 * Represents an adaptor to a lower level web server
 */
export interface ApiServer {
	/**
	 * Whether or not to disable static serialization when using this server. Do this if the default serialization
	 * cannot be overridden.
	 */
	disableSerialization?: boolean;
	/**
	 * Whether or not this server can be locally run. ex: This would be false for claudia adaptor.
	 */
	locallyRunnable: boolean;
	/**
	 * Register an endpoint and handler on the underlying server.
	 */
	register: (path: string, method: HttpMethod, handler: (request: ApiRequest) =>
		ApiResponse | Promise<ApiResponse>) => void;
	/**
	 * Whether or not to host the documentation site.
	 */
	allowDocSite: boolean;
	/**
	 * Start the underlying server and pass back what should be exported from the start function.
	 */
	getExport: (metadata: ValoryMetadata, options: any) => { valory: ValoryMetadata };
	/**
	 * Shut it all down
	 */
	shutdown: () => void;
}

/** @hidden */
export interface ValoryMetadata {
	metadataVersion: number;
	undocumentedEndpoints: string[];
	disableSerialization: string[];
	valoryPath: string;
	compiledSwaggerPath: string;
	swagger: Swagger.Spec;
}
