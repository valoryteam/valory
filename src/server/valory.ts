import {FastifyAdaptor} from "valory-adaptor-fastify";
import {ValidatorModule} from "../compiler/compilerheaders";
import * as Swagger from "./swagger";
import {assign, forIn, isNil, omitBy, set, uniq} from "lodash";
import {COMPILED_SWAGGER_PATH, loadModule, ROOT_PATH} from "../compiler/loader";
import {readFileSync} from "fs";
import {Steed} from "steed";
import {Logger} from "pino";
import {ApiRequest, AttachmentKey} from "./request";

global.Promise = require("bluebird");

import P = require("pino");
import pathMod = require("path");
import {fastConcat} from "../lib/helpers";

const steed: Steed = require("steed")();
const uuid = require("hyperid")();
const COMMONROUTEKEY = "ALL";
/** @hidden */ export const VALORYLOGGERVAR = "LOGLEVEL";
/** @hidden */ export const VALORYCONFIGFILE = "valory.json";
/** @hidden */ export const VALORYPRETTYLOGGERVAR = "PRETTYLOG";
const ERRORTABLEHEADER = "|Status Code|Name|Description|\n|-|-|--|\n";
const REDOCPATH = "../../html/index.html";

const DefaultErrorFormatter: ErrorFormatter = (error, message): ApiResponse => {
	return {
		statusCode: error.statusCode,
		body: {
			code: error.errorCode,
			message: (message != null) ? message : error.defaultMessage,
		},
		headers: {"Content-Type": "application/json"},
	};
};

// export interface ValoryConfig {
// 	adaptorModule: string;
// 	apiEntrypoint: string;
// 	adaptorConfiguration: {[key: string]: string};
// 	workerConfiguration: {};
// }

export type ErrorFormatter = (error: ErrorDef, message?: string | string[]) => ApiResponse;

export interface ApiExchange {
	headers: { [key: string]: any };
	body: any;
}

export interface ApiResponse extends ApiExchange {
	statusCode: number;
}

export type ApiMiddlewareHandler = (req: ApiRequest, logger: Logger,
									done: (error?: ApiResponse) => void) => void;

export interface ApiMiddleware {
	tag?: Array<Swagger.Tag | string> | Swagger.Tag | string;
	name: string;
	handler: ApiMiddlewareHandler;
}

// declare class ApiMiddleware<T> {
// 	public static middlewareName: AttachmentKey<T>;
//
// }

export interface ValoryOptions {
	info: Swagger.Info;
	server: ApiServer;
	errors?: { [x: string]: ErrorDef };
	consumes?: string[];
	produces?: string[];
	parameters?: {[name: string]: Swagger.QueryParameter | Swagger.BodyParameter};
	responses?: {[name: string]: Swagger.Response };
	definitions?: { [x: string]: Swagger.Schema };
	tags?: Swagger.Tag[];
	basePath?: string;
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
	locallyRunnable: boolean;
	register: (path: string, method: HttpMethod, handler: (request: ApiRequest) =>
		ApiResponse | Promise<ApiResponse>) => void;
	allowDocSite: boolean;
	getExport: (metadata: ValoryMetadata, options: any) => { valory: ValoryMetadata };
	shutdown: () => void;
}

export interface ValoryMetadata {
	undocumentedEndpoints: string[];
	valoryPath: string;
	compiledSwaggerPath: string;
	swagger: Swagger.Spec;
}

const DefaultErrors: { [x: string]: ErrorDef } = {
	ValidationError: {
		statusCode: 200,
		errorCode: 1001,
		defaultMessage: "Invalid Parameters",
	},
	TokenMalformed: {
		statusCode: 200,
		errorCode: 1002,
		defaultMessage: "Authorization Failure",
	},
	InternalError: {
		statusCode: 200,
		errorCode: 1003,
		defaultMessage: "An internal error occured",
	},
};

export class Valory {
	public static ValidationResultKey: AttachmentKey<true | string[] | string>
		= ApiRequest.createKey<true | string[] | string>();
	public static RequestIDKey: AttachmentKey<string> = ApiRequest.createKey<string>();
	public static ResponseKey: AttachmentKey<ApiResponse> = ApiRequest.createKey<ApiResponse>();

	/**
	 * Create the Valory instance
	 */
	public static createInstance(options: ValoryOptions): Valory {
		Valory.directInstantiation = false;
		return new Valory(options.info, options.errors || {}, options.consumes, options.produces, options.definitions || {},
			options.tags || [], options.server, options.basePath, options.parameters, options.responses);
	}
	/**
	 * Get the valory instance
	 */
	public static getInstance(): Valory {
		if (Valory.instance == null) {
			throw Error("Valory instance has not yet been created");
		}
		return Valory.instance;
	}
	private static instance: Valory;
	private static directInstantiation = true;
	public Logger = P({level: process.env[VALORYLOGGERVAR] || "info",
		prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true"});
	private COMPILERMODE = (process.env.VALORYCOMPILER === "TRUE");
	private TESTMODE: boolean = (process.env.TEST_MODE === "TRUE");
	private errorFormatter: ErrorFormatter = DefaultErrorFormatter;
	private globalMiddleware: ApiMiddleware[] = [];
	private globalPostMiddleware: ApiMiddleware[] = [];
	private apiDef: Swagger.Spec;
	private server: ApiServer;
	private validatorModule: ValidatorModule;
	private errors = DefaultErrors;
	private metadata: ValoryMetadata = {
		undocumentedEndpoints: [],
		valoryPath: __dirname,
		compiledSwaggerPath: COMPILED_SWAGGER_PATH,
		swagger: null,
	};

	/**
	 * @deprecated use [[Valory.createInstance]] instead
	 */
	constructor(info: Swagger.Info, errors: { [x: string]: ErrorDef }, consumes: string[] = [], produces: string[] = [],
				definitions: { [x: string]: Swagger.Schema }, tags: Swagger.Tag[], server: ApiServer, basePath?: string,
				parameters: {[name: string]: Swagger.QueryParameter | Swagger.BodyParameter} = {},
				responses: {[name: string]: Swagger.Response} = {}) {
		if (Valory.instance != null) {
			throw Error("Only a single valory instance is allowed");
		}
		if (Valory.directInstantiation) {
			this.Logger.warn("Direct instantiation of Valory is deprecated and will " +
				"break in the next major version. Use Valory.createInstance instead.");
		}
		Valory.instance = this;
		this.Logger.info("Starting valory");
		// const configPath = valoryConfigPath();
		// try {
		// 	this.config = loadConfig(pathMod.resolve(configPath));
		// } catch {
		// 	throw Error("Failed to load valory config");
		// }
		// this.Logger.info(this.config);
		this.apiDef = {
			swagger: "2.0",
			info,
			paths: {},
			definitions,
			tags,
			consumes,
			produces,
			parameters,
			responses,
		};

		if (basePath != null) {
			this.Logger.debug("Path prefix set:", basePath);
			this.apiDef.basePath = basePath;
		}

		this.server = server;
		// this.server = new (require(this.config.adaptorModule))() as ApiServer;
		Object.assign(this.errors, errors);
		// assign(this.errors, errors);
		if (!this.COMPILERMODE) {
			if (this.TESTMODE) {
				this.server = new FastifyAdaptor() as any;
			}
			this.validatorModule = loadModule(definitions);
			if (this.server.allowDocSite) {
				this.registerDocSite();

			}
		} else {
			this.Logger.info("Starting in compiler mode");
			this.apiDef.tags.push(generateErrorTable(this.errors));
		}
	}

	/**
	 * Register an endpoint with a given method
	 */
	public endpoint(path: string, method: HttpMethod, swaggerDef: Swagger.Operation, handler: ApiHandler,
					middleware: ApiMiddleware[] = [], documented: boolean = true, postMiddleware: ApiMiddleware[] = []) {
		const stringMethod = HttpMethod[method].toLowerCase();
		this.Logger.debug(`Registering endpoint ${this.apiDef.basePath || ""}${path}:${stringMethod}`);
		if (this.COMPILERMODE) {
			this.endpointCompile(path, method, swaggerDef, handler, stringMethod, middleware, documented, postMiddleware);
		} else {
			this.endpointRun(path, method, swaggerDef, handler, stringMethod, middleware, documented, postMiddleware);
		}
	}

	/**
	 * Override the default error formatter
	 */
	public setErrorFormatter(formatter: ErrorFormatter) {
		this.errorFormatter = formatter;
	}

	/**
	 * Build an ApiExchange from either an error name or an ErrorDef
	 */
	public buildError(error: string | ErrorDef, message?: string | string[]): ApiResponse {
		const errorDef: ErrorDef = (typeof error === "string") ? this.errors[error] : error;
		if (errorDef == null) {
			throw Error(`Error definition "${error}" does not exist`);
		}
		return this.errorFormatter(errorDef, message);
	}

	/**
	 * Convenience method to build a return exchange when only body and/or header customization is required
	 */
	public buildSuccess(body: any, headers: {[key: string]: any} = {}): ApiResponse {
		if (headers["Content-Type"] == null) {
			if (typeof body === "object") {
				headers["Content-Type"] = "application/json";
			} else if (typeof body === "string") {
				headers["Content-Type"] = "text/plain";
			}
		}
		return {
			body,
			headers,
			statusCode: 200,
		};
	}

	/**
	 * Register GET endpoint
	 */
	public get(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
			   documented: boolean = true, postMiddleware: ApiMiddleware[] = []) {
		this.endpoint(path, HttpMethod.GET, swaggerDef, handler, middleware, documented, postMiddleware);
	}

	/**
	 * Register POST endpoint
	 */
	public post(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
				documented: boolean = true, postMiddleware: ApiMiddleware[] = []) {
		this.endpoint(path, HttpMethod.POST, swaggerDef, handler, middleware, documented, postMiddleware);
	}

	/**
	 * Register DELETE endpoint
	 */
	public delete(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
				  documented: boolean = true, postMiddleware: ApiMiddleware[] = []) {
		this.endpoint(path, HttpMethod.DELETE, swaggerDef, handler, middleware, documented, postMiddleware);
	}

	/**
	 * Register HEAD endpoint
	 */
	public head(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
				documented: boolean = true, postMiddleware: ApiMiddleware[] = []) {
		this.endpoint(path, HttpMethod.HEAD, swaggerDef, handler, middleware, documented, postMiddleware);
	}

	/**
	 * Register PATCH endpoint
	 */
	public patch(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
				 documented: boolean = true, postMiddleware: ApiMiddleware[] = []) {
		this.endpoint(path, HttpMethod.PATCH, swaggerDef, handler, middleware, documented, postMiddleware);
	}

	/**
	 * Register PUT endpoint
	 */
	public put(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
			   documented: boolean = true, postMiddleware: ApiMiddleware[] = []) {
		this.endpoint(path, HttpMethod.PUT, swaggerDef, handler, middleware, documented, postMiddleware);
	}

	/**
	 * Register a global middleware run before every endpoint
	 */
	public addGlobalMiddleware(middleware: ApiMiddleware) {
		this.Logger.debug("Adding global middleware:", middleware.name);
		this.globalMiddleware.push(middleware);
	}

	/**
	 * Register a global post middleware run after every endpoint
	 */
	public addGlobalPostMiddleware(middleware: ApiMiddleware) {
		this.Logger.debug("Adding global post middleware:", middleware.name);
		this.globalPostMiddleware.push(middleware);
	}

	/**
	 * Start server and build appserver export object
	 */
	public start(options: any): any {
		this.Logger.info("Valory startup complete");
		this.metadata.swagger = this.apiDef;
		return this.server.getExport(this.metadata, options);
	}

	/**
	 * Shuts down the server core
	 */
	public shutdown() {
		this.server.shutdown();
	}

	private endpointCompile(path: string, method: HttpMethod, swaggerDef: Swagger.Operation, handler: ApiHandler,
							stringMethod: string, middleware: ApiMiddleware[] = [], documented: boolean = true,
							postMiddleware: ApiMiddleware[] = []) {
		const middlewares: ApiMiddleware[] = fastConcat(this.globalMiddleware, middleware,
			this.globalPostMiddleware, postMiddleware);
		for (const item of middlewares) {
			if (item.tag != null) {
				if (!(item.tag instanceof Array)) {
					item.tag = [item.tag];
				}
				for (const def of (item.tag as Array<string | Swagger.Tag>)) {
					let tag = "";
					if (typeof def === "string") {
						tag = def;
					} else {
						this.apiDef.tags.push(def);
						tag = def.name;
					}
					(swaggerDef.tags == null) ? swaggerDef.tags = [tag] : swaggerDef.tags.push(tag);
				}
			}
		}
		swaggerDef.tags = uniq(swaggerDef.tags);
		this.apiDef.tags = uniq(this.apiDef.tags);
		set(this.apiDef.paths, `${path}.${stringMethod}`, swaggerDef);
	}

	private endpointRun(path: string, method: HttpMethod, swaggerDef: Swagger.Operation,
						handler: ApiHandler, stringMethod: string, middleware: ApiMiddleware[] = [],
						documented: boolean = true, postMiddleware: ApiMiddleware[] = []) {
		const validator = this.validatorModule.getValidator(path, stringMethod);
		if (this.apiDef.basePath != null) {
			path = this.apiDef.basePath + path;
		}
		if (validator == null) {
			throw Error("Compiled swagger is out of date. Please run valory cli");
		}
		const route = `${path}:${stringMethod}`;
		const childLogger = this.Logger.child({endpoint: route});
		const middlewares: ApiMiddleware[] = fastConcat(this.globalMiddleware, middleware);
		const postMiddlewares = fastConcat(this.globalPostMiddleware, postMiddleware);
		const chindings: string = (childLogger as any).chindings;
		const wrapper = async (req: ApiRequest): Promise<ApiResponse> => {
			const requestId = uuid();
			req.putAttachment(Valory.RequestIDKey, requestId);
			(childLogger as any).chindings = `${chindings},"requestId":"${requestId}"`;
			childLogger.debug(req, "Received request");
			try {
				const middlewareResp: void | ApiResponse = await processMiddleware(middlewares, req, childLogger);
				if (middlewareResp != null) {
					return (middlewareResp as ApiResponse);
				}
				const result = validator(req);
				let response: ApiResponse;
				if (result !== true) {
					response = this.buildError("ValidationError", result as string[]);
				} else {
					response = await handler(req, childLogger, {requestId});
				}
				req.putAttachment(Valory.ValidationResultKey, result);
				req.putAttachment(Valory.ResponseKey, response);
				const postMiddlewareResp: void | ApiResponse = await processMiddleware(postMiddlewares, req, childLogger);
				if (postMiddlewareResp != null) {
					return (postMiddlewareResp as ApiResponse);
				}
				return response;
			} catch (error) {
				childLogger.error("Internal exception occurred while processing request");
				childLogger.error(error);
				return this.buildError("InternalError");
			}
		};
		this.server.register(path, method, wrapper);
	}

	private registerDocSite() {
		const prefix = this.apiDef.basePath || "";
		const redoc = readFileSync(pathMod.join(__dirname, REDOCPATH), {encoding: "utf8"}).replace("%prefix%", prefix);
		const swaggerBlob = this.validatorModule.swaggerBlob;
		this.server.register(prefix + "/swagger.json", HttpMethod.GET, (req) => {
			return {
				body: swaggerBlob,
				headers: {"Content-Type": "text/plain" },
				query: null,
				path: null,
				statusCode: 200,
				formData: null,
			};
		});
		this.server.register((prefix !== "") ? prefix : "/", HttpMethod.GET, (req) => {
			return {
				body: redoc,
				headers: {"Content-Type": "text/html"},
				query: null,
				path: null,
				statusCode: 200,
				formData: null,
			};
		});
	}
}

function processMiddleware(middlewares: ApiMiddleware[],
						   req: ApiRequest, logger: Logger): Promise<void | ApiResponse> {
	return new Promise<void | ApiResponse>((resolve) => {
		let err: ApiExchange = null;
		steed.eachSeries(middlewares, (handler: ApiMiddleware, done) => {
			const childLog = logger.child({middleware: handler.name});
			childLog.debug("Running Middleware");
			handler.handler(req, childLog, (error) => {
				if (error != null) {
					err = error;
					done(error);
					return;
				}

				// if (data != null) {
				// 	req.attachments[handler.name] = data;
				// }
				done();
			});
		}, (error) => {
			resolve(err as ApiResponse);
		});
	});
}

function generateErrorTable(errors: { [x: string]: ErrorDef }): Swagger.Tag {
	const tagDef: Swagger.Tag = {name: "Errors", description: "", externalDocs: null};
	let table = ERRORTABLEHEADER;
	forIn(errors, (error: ErrorDef, name: string) => {
		"use strict";
		table += "|" + error.errorCode + "|" + name + "|" + error.defaultMessage + "|\n";
	});
	tagDef.description = table;
	return omitBy(tagDef, isNil) as Swagger.Tag;
}

function valoryConfigPath(): string {
	if (process.env.VALORYCONFIG) {
		return process.env.VALORYCONFIG;
	} else {
		return pathMod.join(ROOT_PATH, "valory.json");
	}
}
