#!/usr/bin/env node

import {Callback} from "github";

global.Promise = require("bluebird");
import {CompilationLevel, ValidatorModule} from "../compiler/compilerheaders";
import {Info, Operation, Schema, Spec, Tag} from "swagger-schema-official";
import {assign, forIn, omitBy, isNil, set} from "lodash";
import {compileAndSave, COMPILED_SWAGGER_PATH, loadModule} from "./loader";
import {readFileSync} from "fs";
import {join} from "path";
import {FastifyAdaptor} from "./adaptors/fastify-adaptor";
import {ErrorCallback, Steed, SteedFunction} from "steed";
import P = require("pino");
import {Logger} from "pino";
const steed: Steed = require("steed")();

const fastTry = require("fast.js/function/try");
const fastForEach = require("fast.js/array/forEach");
const fastConcat = require("fast.js/array/concat");
// const stringify = require("fast-json-stable-stringify");
const uuid = require("hyperid")();
const COMMONROUTEKEY = "ALL";
const VALORYLOGGERVAR = "LOGLEVEL";
export const VALORYPRETTYLOGGERVAR = "PRETTYLOG";
const ERRORTABLEHEADER = "|Status Code|Name|Description|\n|-|-|--|\n";
const REDOCPATH = "../../html/index.html";
export const ValoryLog = P({level: process.env[VALORYLOGGERVAR] || "info",
	prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true"});

export interface ApiExchange {
	headers: { [key: string]: any };
	body: any;
	formData?: { [key: string]: any };
	query?: { [key: string]: any };
	path?: { [key: string]: any };
	statusCode: number;
	attachments?: {[key: string]: any};
	route?: string;
}

export type ApiMiddlewareHandler = (req: ApiExchange, logger: Logger,
									done: (error?: ApiExchange, attachment?: any) => void) => void;

export interface ApiMiddleware {
	name: string;
	handler: ApiMiddlewareHandler;
}

export interface ErrorDef {
	code: number;
	defaultMessage: string;
}

export interface RequestContext {
	requestId: string;
}

export type ApiHandler = (request: ApiExchange, logger: Logger, requestContext: RequestContext)
	=> Promise<ApiExchange> | ApiExchange;

export enum HttpMethod {
	POST,
	PUT,
	GET,
	DELETE,
	HEAD,
	PATCH,
}

export interface ApiServer {
	register: (path: string, method: HttpMethod, handler: (request: ApiExchange) =>
		ApiExchange | Promise<ApiExchange>) => void;
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
		code: 1001,
		defaultMessage: "Invalid Parameters",
	},
	TokenMalformed: {
		code: 1002,
		defaultMessage: "Authorization Failure",
	},
	InternalError: {
		code: 1003,
		defaultMessage: "An internal error occured",
	},
};

export class Valory {
	private COMPILERMODE: boolean = (process.env.VALORYCOMPILER === "TRUE");
	private globalMiddleware: ApiMiddleware[] = [];
	private apiDef: Spec;
	private server: ApiServer;
	private validatorModule: ValidatorModule;
	private errors = DefaultErrors;
	private metadata: ValoryMetadata = {
		undocumentedEndpoints: [],
		valoryPath: __dirname,
		compiledSwaggerPath: COMPILED_SWAGGER_PATH,
		swagger: null,
	};

	constructor(info: Info, errors: { [x: string]: ErrorDef }, consumes: string[] = [], produces: string[] = [],
				definitions: { [x: string]: Schema }, tags: Tag[], server: ApiServer = new FastifyAdaptor()) {
		ValoryLog.info("Starting valory");
		this.apiDef = {
			swagger: "2.0",
			info,
			paths: {},
			definitions,
			tags,
			consumes,
			produces,
		};
		this.server = server;
		assign(this.errors, errors);

		if (!this.COMPILERMODE) {
			const mod: ValidatorModule | Error = fastTry(() => loadModule(definitions));
			if (mod instanceof Error) {
				throw mod;
			} else {
				this.validatorModule = mod;
				if (server.allowDocSite) {
					this.registerDocSite();
				}
			}
		} else {
			ValoryLog.info("Starting in compiler mode");
			this.apiDef.tags.push(generateErrorTable(this.errors));
		}
	}

	public endpoint(path: string, method: HttpMethod, swaggerDef: Operation, handler: ApiHandler,
					middleware: ApiMiddleware[] = [], documented: boolean = true) {
		const stringMethod = HttpMethod[method].toLowerCase();
		ValoryLog.debug(`Registering endpoint ${path}:${stringMethod}`);
		if (this.COMPILERMODE) {
			this.endpointCompile(path, method, swaggerDef, handler, stringMethod, middleware, documented);
		} else {
			this.endpointRun(path, method, swaggerDef, handler, stringMethod, middleware, documented);
		}
	}

	public get(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
			   documented: boolean = true) {
		this.endpoint(path, HttpMethod.GET, swaggerDef, handler, middleware, documented);
	}

	public post(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
				documented: boolean = true) {
		this.endpoint(path, HttpMethod.POST, swaggerDef, handler, middleware, documented);
	}

	public delete(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
				  documented: boolean = true) {
		this.endpoint(path, HttpMethod.DELETE, swaggerDef, handler, middleware, documented);
	}

	public head(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
				documented: boolean = true) {
		this.endpoint(path, HttpMethod.HEAD, swaggerDef, handler, middleware, documented);
	}

	public patch(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
				 documented: boolean = true) {
		this.endpoint(path, HttpMethod.PATCH, swaggerDef, handler, middleware, documented);
	}

	public put(path: string, swaggerDef: Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
			   documented: boolean = true) {
		this.endpoint(path, HttpMethod.PUT, swaggerDef, handler, middleware, documented);
	}

	public addGlobalMiddleware(middleware: ApiMiddleware) {
		ValoryLog.debug("Adding global middleware:", middleware.name);
		this.globalMiddleware.push(middleware);
	}

	public start(options: any): { valory: ValoryMetadata } {
		ValoryLog.info("Valory startup complete");
		this.metadata.swagger = this.apiDef;
		return this.server.getExport(this.metadata, options);
	}

	public shutdown() {
		this.server.shutdown();
	}

	private endpointCompile(path: string, method: HttpMethod, swaggerDef: Operation, handler: ApiHandler,
							stringMethod: string, middleware: ApiMiddleware[] = [], documented: boolean = true) {
		// TODO: add undocumented support
		set(this.apiDef.paths, `${path}.${stringMethod}`, swaggerDef);
	}

	private endpointRun(path: string, method: HttpMethod, swaggerDef: Operation,
						handler: ApiHandler, stringMethod: string, middleware: ApiMiddleware[] = [], documented: boolean = true) {
		const validator = this.validatorModule.getValidator(path, stringMethod);
		if (validator == null) {
			throw Error("Compiled swagger is out of date. Please run valory cli");
		}
		const route = `${path}:${stringMethod}`;
		const childLogger = ValoryLog.child({endpoint: route});
		const middlewares: ApiMiddleware[] = fastConcat(this.globalMiddleware, middleware);
		const chindings: string = (childLogger as any).chindings;
		const wrapper = async (req: ApiExchange): Promise<ApiExchange> => {
			// TODO: implement authorizer support
			const requestId = uuid();
			req.attachments.requestId = requestId;
			(childLogger as any).chindings = `${chindings},"requestId":"${requestId}"`;
			childLogger.debug(req, "Received request");
			const middlewareResp: void | ApiExchange = await processMiddleware(middlewares, req, childLogger);
			if (middlewareResp != null) {
				return (middlewareResp as ApiExchange);
			}
			const result = validator(req);
			if (result !== true) {
				return {
					statusCode: 200,
					body: {code: DefaultErrors.ValidationError.code, message: result},
					headers: {"Content-Type": "application/json"},
				};
			} else {
				return await handler(req, childLogger, {requestId});
			}
		};
		this.server.register(path, method, wrapper);
	}

	private registerDocSite() {
		const redoc = readFileSync(join(__dirname, REDOCPATH), {encoding: "utf8"});
		const swaggerBlob = this.validatorModule.swaggerBlob;
		this.server.register("/swagger.json", HttpMethod.GET, (req) => {
			return {
				body: swaggerBlob,
				headers: {"Content-Type": "text/plain"},
				query: null,
				path: null,
				statusCode: 200,
				formData: null,
			};
		});
		this.server.register("/", HttpMethod.GET, (req) => {
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
						   req: ApiExchange, logger: Logger): Promise<void | ApiExchange> {
	return new Promise<void | ApiExchange>((resolve) => {
		let err: ApiExchange = null;
		steed.eachSeries(middlewares, (handler: ApiMiddleware, done) => {
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
			resolve(err as ApiExchange);
		});
	});
}

function generateErrorTable(errors: { [x: string]: ErrorDef }): Tag {
	const tagDef: Tag = {name: "Errors", description: "", externalDocs: null};
	let table = ERRORTABLEHEADER;
	forIn(errors, (error: ErrorDef, name: string) => {
		"use strict";
		table += "|" + error.code + "|" + name + "|" + error.defaultMessage + "|\n";
	});
	tagDef.description = table;
	return omitBy(tagDef, isNil) as Tag;
}

if (!module.parent) {
	process.env.VALORYCOMPILER = "TRUE";
	const relative = require("require-relative");
	const args = require("nomnom").options({
		entrypoint: {
			position: 0,
			help: "Main entrypoint for the api",
			required: true,
		},
		host: {
			position: 1,
			help: "The host for your api e.g. somewebsite.com",
		},
		scheme: {
			abbr: "s",
			help: "The access method for your api. e.g. https",
			default: "https",
		},
		basePath: {
			abbr: "r",
			help: "Api path relative to the host. It must start with a slash. e.g. /store/dev",
			callback: (resourcePath: string) => {
				return (resourcePath.startsWith("/")) ? true : "Resource path MUST start with a '/'";
			},
			required: true,
			default: "/",
		},
		outputFile: {
			abbr: "o",
			help: "File to write output to",
			default: join(process.cwd(), "swagger.json"),
		},
		version: {
			abbr: "v",
			help: "Api version string e.g. '1.0.0'",
			required: true,
			transform: (v: number) => {
				return v.toString();
			},
		},
		singleError: {
			flag: true,
			help: "Only return a single validation error at a time",
			default: false,
		},
		compilationLevel: {
			abbr: "l",
			help: "Compilation level ['SIMPLE', 'ADVANCED', 'WHITESPACE_ONLY']",
			required: true,
			default: "ADVANCED",
			callback: (level: string) => {
				"use strict";
				return (["SIMPLE", "ADVANCED", "WHITESPACE_ONLY"]
					.indexOf(level) > -1) ? true : "Must be one of [\"SIMPLE\", \"ADVANCED\", \"WHITESPACE_ONLY\"]";
			},
			enum: ["SIMPLE", "ADVANCED", "WHITESPACE_ONLY"],
		},
		debugMode: {
			abbr: "d",
			help: "Enable debug mode for the compiler",
			default: false,
			flag: true,
		},
	}).parse();
	args.entrypoint = (args.entrypoint.startsWith("/") || args.entrypoint.startsWith("."))
		? args.entrypoint : "./" + args.entrypoint;
	const valExport: {valory: ValoryMetadata} = relative(args.entrypoint, process.cwd());
	const api = valExport.valory.swagger;
	api.schemes = args.schemes;
	api.host = args.host;
	api.info.version = args.version;
	const output = omitBy(api, isNil) as Spec;
	const compLevel = CompilationLevel[args.compilationLevel] as any;
	compileAndSave(output, valExport.valory.compiledSwaggerPath, process.cwd(),
		valExport.valory.undocumentedEndpoints, {debug: args.debugMode, compilationLevel: compLevel,
			singleError: args.singleError})
		.then(() => {ValoryLog.info("Compilation Complete"); process.exit(0); });
}
