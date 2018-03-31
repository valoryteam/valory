import {FastifyAdaptor} from "valory-adaptor-fastify";

global.Promise = require("bluebird");

import {CompilationLevel, ValidatorModule} from "../compiler/compilerheaders";
import {Info, Operation, Schema, Spec, Tag} from "swagger-schema-official";
import {assign, forIn, omitBy, isNil, set} from "lodash";
import {compileAndSave, COMPILED_SWAGGER_PATH, loadModule, ROOT_PATH} from "../compiler/loader";
import {readFileSync} from "fs";
import {ErrorCallback, Steed, SteedFunction} from "steed";
import P = require("pino");
import {Logger} from "pino";
import {loadConfig} from "../lib/config";
import pathMod = require("path");
import {Exception} from "tstl";
import {ApiRequest, AttachmentKey} from "./request";
const steed: Steed = require("steed")();

const fastTry = require("fast.js/function/try");
const fastForEach = require("fast.js/array/forEach");
const fastConcat = require("fast.js/array/concat");
// const stringify = require("fast-json-stable-stringify");
const uuid = require("hyperid")();
const COMMONROUTEKEY = "ALL";
export const VALORYLOGGERVAR = "LOGLEVEL";
export const VALORYCONFIGFILE = "valory.json";
export const VALORYPRETTYLOGGERVAR = "PRETTYLOG";
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

export interface ValoryConfig {
	adaptorModule: string;
	apiEntrypoint: string;
	adaptorConfiguration: {[key: string]: string};
	workerConfiguration: {};
}

export type ErrorFormatter = (error: ErrorDef, message?: string) => ApiResponse;

export interface ApiExchange {
	headers: { [key: string]: any };
	body: any;
}

export interface ApiResponse extends ApiExchange {
	statusCode: number;
}

export type ApiMiddlewareHandler<T> = (req: ApiRequest, logger: Logger,
									done: (error?: ApiResponse, attachment?: T) => void) => void;

export interface ApiMiddleware<T> {
	name: AttachmentKey<T>;
	handler: ApiMiddlewareHandler<T>;
}

// declare class ApiMiddleware<T> {
// 	public static middlewareName: AttachmentKey<T>;
//
// }

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
	swagger: Spec;
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
	public Logger = P({level: process.env[VALORYLOGGERVAR] || "info",
		prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true"});
	private COMPILERMODE = (process.env.VALORYCOMPILER === "TRUE");
	private TESTMODE: boolean = (process.env.TEST_MODE === "TRUE");
	private errorFormatter: ErrorFormatter = DefaultErrorFormatter;
	private globalMiddleware: Array<ApiMiddleware<any>> = [];
	private apiDef: Spec;
	private server: ApiServer;
	private validatorModule: ValidatorModule;
	private errors = DefaultErrors;
	private config: ValoryConfig = null;
	private metadata: ValoryMetadata = {
		undocumentedEndpoints: [],
		valoryPath: __dirname,
		compiledSwaggerPath: COMPILED_SWAGGER_PATH,
		swagger: null,
	};

	constructor(info: Info, errors: { [x: string]: ErrorDef }, consumes: string[] = [], produces: string[] = [],
				definitions: { [x: string]: Schema }, tags: Tag[], server: ApiServer, basePath?: string) {
		if (Valory.instance != null) {
			throw Error("Only a single valory instance is allowed");
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
		};

		if (basePath != null) {
			this.Logger.debug("Path prefix set:", basePath);
			this.apiDef.basePath = basePath;
		}

		this.server = server;
		// this.server = new (require(this.config.adaptorModule))() as ApiServer;
		assign(this.errors, errors);
		if (!this.COMPILERMODE) {
			if (this.TESTMODE) {
				this.server = new FastifyAdaptor();
			}
			const mod: ValidatorModule | Error = fastTry(() => loadModule(definitions));
			if (mod instanceof Error) {
				throw mod;
			} else {
				this.validatorModule = mod;
				if (this.server.allowDocSite) {
					this.registerDocSite();
				}
			}
		} else {
			this.Logger.info("Starting in compiler mode");
			this.apiDef.tags.push(generateErrorTable(this.errors));
		}
	}

	/**
	 * Register an endpoint with a given method
	 */
	public endpoint(path: string, method: HttpMethod, swaggerDef: Operation, handler: ApiHandler,
					middleware: Array<ApiMiddleware<any>> = [], documented: boolean = true) {
		const stringMethod = HttpMethod[method].toLowerCase();
		this.Logger.debug(`Registering endpoint ${this.apiDef.basePath || ""}${path}:${stringMethod}`);
		if (this.COMPILERMODE) {
			this.endpointCompile(path, method, swaggerDef, handler, stringMethod, middleware, documented);
		} else {
			this.endpointRun(path, method, swaggerDef, handler, stringMethod, middleware, documented);
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
	public buildError(error: string | ErrorDef, message?: string): ApiResponse {
		const errorDef: ErrorDef = (typeof error === "string") ? this.errors[error] : error;
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
	public get(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: Array<ApiMiddleware<any>> = [],
			   documented: boolean = true) {
		this.endpoint(path, HttpMethod.GET, swaggerDef, handler, middleware, documented);
	}

	/**
	 * Register POST endpoint
	 */
	public post(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: Array<ApiMiddleware<any>> = [],
				documented: boolean = true) {
		this.endpoint(path, HttpMethod.POST, swaggerDef, handler, middleware, documented);
	}

	/**
	 * Register DELETE endpoint
	 */
	public delete(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: Array<ApiMiddleware<any>> = [],
				  documented: boolean = true) {
		this.endpoint(path, HttpMethod.DELETE, swaggerDef, handler, middleware, documented);
	}

	/**
	 * Register HEAD endpoint
	 */
	public head(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: Array<ApiMiddleware<any>> = [],
				documented: boolean = true) {
		this.endpoint(path, HttpMethod.HEAD, swaggerDef, handler, middleware, documented);
	}

	/**
	 * Register PATCH endpoint
	 */
	public patch(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: Array<ApiMiddleware<any>> = [],
				 documented: boolean = true) {
		this.endpoint(path, HttpMethod.PATCH, swaggerDef, handler, middleware, documented);
	}

	/**
	 * Register PUT endpoint
	 */
	public put(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: Array<ApiMiddleware<any>> = [],
			   documented: boolean = true) {
		this.endpoint(path, HttpMethod.PUT, swaggerDef, handler, middleware, documented);
	}

	/**
	 * Register a global middleware run before every endpoint
	 */
	public addGlobalMiddleware<T>(middleware: ApiMiddleware<T>) {
		this.Logger.debug("Adding global middleware:", middleware.name);
		this.globalMiddleware.push(middleware);
	}

	/**
	 * Start server and build appserver export object
	 */
	public start(options: any): { valory: ValoryMetadata } {
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

	private endpointCompile(path: string, method: HttpMethod, swaggerDef: Operation, handler: ApiHandler,
							stringMethod: string, middleware: Array<ApiMiddleware<any>> = [], documented: boolean = true) {
		// TODO: add undocumented support
		set(this.apiDef.paths, `${path}.${stringMethod}`, swaggerDef);
	}

	private endpointRun(path: string, method: HttpMethod, swaggerDef: Operation,
						handler: ApiHandler, stringMethod: string, middleware: Array<ApiMiddleware<any>> = [],
						documented: boolean = true) {
		const validator = this.validatorModule.getValidator(path, stringMethod);
		if (this.apiDef.basePath != null) {
			path = this.apiDef.basePath + path;
		}
		if (validator == null) {
			throw Error("Compiled swagger is out of date. Please run valory cli");
		}
		const route = `${path}:${stringMethod}`;
		const childLogger = this.Logger.child({endpoint: route});
		const middlewares: Array<ApiMiddleware<any>> = fastConcat(this.globalMiddleware, middleware);
		const chindings: string = (childLogger as any).chindings;
		const wrapper = async (req: ApiRequest): Promise<ApiResponse> => {
			// TODO: implement authorizer support
			const requestId = uuid();
			req.attachments.requestId = requestId;
			(childLogger as any).chindings = `${chindings},"requestId":"${requestId}"`;
			childLogger.debug(req, "Received request");
			const middlewareResp: void | ApiResponse = await processMiddleware(middlewares, req, childLogger);
			if (middlewareResp != null) {
				return (middlewareResp as ApiResponse);
			}
			const result = validator(req);
			if (result !== true) {
				return {
					statusCode: 200,
					body: {code: DefaultErrors.ValidationError.errorCode, message: result},
					headers: {"Content-Type": "application/json"},
				};
			} else {
				return await handler(req, childLogger, {requestId});
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

function processMiddleware(middlewares: Array<ApiMiddleware<any>>,
						   req: ApiRequest, logger: Logger): Promise<void | ApiResponse> {
	return new Promise<void | ApiResponse>((resolve) => {
		let err: ApiExchange = null;
		steed.eachSeries(middlewares, (handler: ApiMiddleware<any>, done) => {
			const childLog = logger.child({middleware: handler.name});
			childLog.debug("Running Middleware");
			handler.handler(req, childLog, (error, data) => {
				if (error != null) {
					err = error;
					done(error);
					return;
				}

				if (data != null) {
					req.attachments[handler.name] = data;
				}
				done();
			});
		}, (error) => {
			resolve(err as ApiResponse);
		});
	});
}

function generateErrorTable(errors: { [x: string]: ErrorDef }): Tag {
	const tagDef: Tag = {name: "Errors", description: "", externalDocs: null};
	let table = ERRORTABLEHEADER;
	forIn(errors, (error: ErrorDef, name: string) => {
		"use strict";
		table += "|" + error.errorCode + "|" + name + "|" + error.defaultMessage + "|\n";
	});
	tagDef.description = table;
	return omitBy(tagDef, isNil) as Tag;
}

function valoryConfigPath(): string {
	if (process.env.VALORYCONFIG) {
		return process.env.VALORYCONFIG;
	} else {
		return pathMod.join(ROOT_PATH, "valory.json");
	}
}
