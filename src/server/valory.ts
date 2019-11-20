import {ValidatorModule} from "../compiler/compilerheaders";
import {eachSeries, fastOmit, fastUUID} from "../lib/helpers";
import {getResponse, ResponseMatrix} from "../lib/responseMatrix";
import {Swagger} from "./swagger";
import {loadModule} from "../compiler/loader";
import {Logger} from "pino";
import {openSync} from "fs";
import {resolve as resolvePath} from "path";
import {ApiRequest, AttachmentKey} from "./request";
import {Config, GENROUTES_VERSION, METADATA_VERSION} from "../lib/config";
import {
	ApiExchange,
	ApiHandler,
	ApiMiddleware,
	ApiResponse,
	ApiServer,
	ErrorDef,
	ErrorFormatter,
	HttpMethod, RequestContext, RequestLogProvider,
	VALORYLOGGERVAR,
	ValoryMetadata,
	VALORYMETAVAR,
	VALORYPRETTYLOGGERVAR,
} from "./valoryheaders";

import P = require("pino");

const flatStr = require("flatstr");

const ERRORTABLEHEADER = "|Status Code|Name|Description|\n|-|-|--|\n";
const REDOCPATH = "../../html/index.html";

const QUOTE_REGEX = /"/g;
const DefaultErrorFormatter: ErrorFormatter = (error, message): ApiResponse => {
	let finalMessage = (message != null) ? message : error.defaultMessage;
	if (typeof finalMessage !== "string") {
		finalMessage = "[";
		for (let i = 0; i < message.length; i++) {
			finalMessage += `"${message[i].replace(QUOTE_REGEX, '\\"')}"`;
			if (i + 1 !== message.length) {
				finalMessage += ",";
			}
		}
		finalMessage += "]";
	} else {
		finalMessage = `"${finalMessage.replace(QUOTE_REGEX, '\\"')}"`;
	}
	return {
		statusCode: error.statusCode,
		body: flatStr(`{"code":${error.errorCode},"message":${finalMessage}}`),
		headers: {"Content-Type": "application/json"},
		disableSerializer: true,
	};
};

const DefaultErrorFormatterNoSerialization: ErrorFormatter = (error, message): ApiResponse => {
	return {
		statusCode: error.statusCode,
		body: (message != null) ? message : error.defaultMessage,
		headers: {"Content-Type": "application/json"},
		disableSerializer: true,
	};
};

/**
 * Options for creating a [[Valory]] instance
 */
export interface ValoryOptions {
	/**
	 * Swagger info
	 */
	info: Swagger.Info;
	/**
	 * Server adaptor to use
	 */
	server: ApiServer;
	/**
	 * Error definitions, cannot be modified after creation
	 */
	errors?: { [x: string]: ErrorDef };
	consumes?: string[];
	produces?: string[];
	/**
	 * Swagger Parameters to include.
	 * NOTE: Should not be used when using decorators
	 */
	parameters?: { [name: string]: Swagger.Parameter };
	/**
	 * Swagger Responses to include
	 * NOTE: Should not be used when using decorators
	 */
	responses?: { [name: string]: Swagger.Response };
	/**
	 * Swagger definitions to include
	 * NOTE: Should not be used when using decorators
	 */
	definitions?: { [x: string]: Swagger.Schema };
	/**
	 * Swagger Tags to include
	 */
	tags?: Swagger.Tag[];
	/**
	 * Base path for the api
	 */
	basePath?: string;
	/**
	 * Name for the request Id property included in logs and response headers
	 */
	requestIDName?: string;
	/**
	 * Base Pino logger
	 */
	baseLogger?: Logger;
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
		defaultMessage: "An internal error occurred",
	},
};

function DefaultRequestLogProvider(parent: Logger, requestContext: RequestContext) {
	const logObj: any = {};
	logObj[requestContext.requestIdName] = requestContext.requestId;
	return parent.child(logObj);
}

export class Valory {
	/** @hidden */
	public static CompileLibOverride: {
		generatedRoutes?: any;
		compswag: ValidatorModule;
	};
	/**
	 * Key used to retrieve validation result attachment. Generally only available to post middleware.
	 */
	public static ValidationResultKey: AttachmentKey<true | string[] | string>
		= ApiRequest.createKey<true | string[] | string>();
	/**
	 * Key used to retrieve the request id attachment.
	 */
	public static RequestIDKey: AttachmentKey<string> = ApiRequest.createKey<string>();
	/**
	 * Key used to retrieve the current response. Only available to post middleware.
	 */
	public static ResponseKey: AttachmentKey<ApiResponse> = ApiRequest.createKey<ApiResponse>();

	/**
	 * Create the Valory instance
	 */
	public static createInstance(options: ValoryOptions): Valory {
		Valory.directInstantiation = false;
		return new Valory(options.info, options.errors || {}, options.consumes, options.produces,
			options.definitions || {}, options.tags || [], options.server, options.basePath,
			options.parameters, options.responses, options.requestIDName, options.baseLogger);
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
	/**
	 * The Pino logger in us by Valory
	 */
	public Logger: Logger;
	private RequestLogger: Logger;
	private COMPILERMODE = process.env.VALORYCOMPILER === "TRUE";
	private TESTMODE: boolean = (process.env.TEST_MODE === "TRUE");
	private DEFAULTADAPTOR: string = process.env.DEFAULT_ADAPTOR;
	private errorFormatter: ErrorFormatter = DefaultErrorFormatter;
	private globalMiddleware: ApiMiddleware[] = [];
	private globalPostMiddleware: ApiMiddleware[] = [];
	private apiDef: Swagger.Spec;
	private validatorModule: ValidatorModule;
	private errors = DefaultErrors;
	private registerGeneratedRoutes: (app: Valory) => void;
	private metadata: ValoryMetadata = {
		metadataVersion: METADATA_VERSION,
		undocumentedEndpoints: [],
		valoryPath: __dirname,
		compiledSwaggerPath: Config.CompSwagPath,
		swagger: null,
		disableSerialization: [],
	};
	private logRequest: (req: ApiRequest, res: ApiResponse, id: string) => void = () => null;
	private requestLogProvider: RequestLogProvider = DefaultRequestLogProvider;

	/**
	 * @deprecated use [[Valory.createInstance]] instead
	 * @hidden
	 */
	private constructor(info: Swagger.Info, errors: { [x: string]: ErrorDef }, consumes: string[] = [],
	                    produces: string[] = [], definitions: { [x: string]: Swagger.Schema }, tags: Swagger.Tag[],
	                    public server: ApiServer, basePath?: string,
	                    parameters: { [name: string]: Swagger.Parameter } = {},
	                    responses: { [name: string]: Swagger.Response } = {},
	                    public requestIDName: string = "request-id",
	                    logger?: Logger) {
		this.Logger = (logger != null) ? logger : P({
			level: process.env[VALORYLOGGERVAR] || "info",
			prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true",
		});
		Config.load(!(!this.COMPILERMODE && Valory.CompileLibOverride));
		if (Valory.instance != null) {
			throw Error("Only a single valory instance is allowed");
		}
		if (Valory.directInstantiation) {
			throw Error("Direct instantiation of valory is not allowed");
		}
		Valory.instance = this;
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

		if (this.server.disableSerialization) {
			this.setErrorFormatter(DefaultErrorFormatterNoSerialization);
		}

		Object.assign(this.errors, errors);
		if (!this.COMPILERMODE) {
			if (process.env.REQUEST_AUDIT_LOG) {
				try {
					const stream = openSync(process.env.REQUEST_AUDIT_LOG, "w");
					this.RequestLogger = P((P as any).extreme(stream));
					this.logRequest = (req, res, id) => {
						this.RequestLogger.info({request: req, response: res, id});
					};
					this.Logger.info(`Request logging enabled: ${resolvePath(process.env.REQUEST_AUDIT_LOG)}`);
				} catch (e) {
					throw Error("Could not create write stream for request audit log: " + e.message);
				}
			}

			this.Logger.info("Starting valory");

			if (this.TESTMODE) {
				this.server = new (require(this.DEFAULTADAPTOR)).DefaultAdaptor();
			}
			if (Config.SourceRoutePath !== "" || Valory.CompileLibOverride) {
				let genRoutes: any;
				if (Valory.CompileLibOverride != null && Valory.CompileLibOverride.generatedRoutes != null) {
					genRoutes = Valory.CompileLibOverride.generatedRoutes;
				} else {
					genRoutes = require(Config.GeneratedRoutePath);
				}
				if (genRoutes.genroutesVersion !== GENROUTES_VERSION) {
					throw Error(
						`Generated routes are version ${
							genRoutes.genroutesVersion} but version ${GENROUTES_VERSION} is required`);
				}
				Object.assign(this.apiDef.definitions, genRoutes.definitions);
				this.registerGeneratedRoutes = genRoutes.register;
			}
			if (Valory.CompileLibOverride != null) {
				this.validatorModule = Valory.CompileLibOverride.compswag;
			} else {
				this.validatorModule = loadModule(definitions);
			}
			if (this.server.allowDocSite) {
				this.registerDocSite();
			}
		} else {
			this.Logger.debug("Starting in compiler mode");
			this.apiDef.tags.push(generateErrorTable(this.errors));
			// console.log(Config);
			if (Config.SourceRoutePath !== "") {
				const genRoutes = require(Config.SourceRoutePath);
				if (genRoutes.genroutesVersion !== GENROUTES_VERSION) {
					// tslint:disable-next-line:max-line-length
					throw Error(`Generated routes are version ${genRoutes.genroutesVersion} but version ${GENROUTES_VERSION} is required`);
				}
				Object.assign(this.apiDef.definitions, genRoutes.definitions);
				this.registerGeneratedRoutes = genRoutes.register;
			}
		}
	}

	/**
	 * Set the [[RequestLogProvider]].
	 */
	public setRequestLogProvider(requestLogProvider: RequestLogProvider) {
		this.requestLogProvider = requestLogProvider;
	}

	/**
	 * Register an endpoint with a given method
	 */
	public endpoint(path: string, method: HttpMethod, swaggerDef: Swagger.Operation, handler: ApiHandler,
	                middleware: ApiMiddleware[] = [], documented: boolean = true, postMiddleware: ApiMiddleware[] = [],
	                disableSerializer: boolean = true) {
		this.Logger.debug(`Registering endpoint ${this.apiDef.basePath || ""}${path}:${method}`);
		if (this.COMPILERMODE) {
			this.endpointCompile(path, method, swaggerDef, handler, method,
				middleware, documented, postMiddleware, disableSerializer);
		} else {
			this.endpointRun(path, method, swaggerDef, handler, method,
				middleware, documented, postMiddleware, disableSerializer);
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
	 * Convenience method to build an [[ApiResponse]].
	 */
	public buildSuccess(body: any, headers: { [key: string]: any } = {}, statusCode = 200,
	                    disableSerializer: boolean = false): ApiResponse {
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
			statusCode,
			disableSerializer,
		};
	}

	/**
	 * Register GET endpoint
	 */
	public get(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
	           documented: boolean = true, postMiddleware: ApiMiddleware[] = [], disableSerializer: boolean = true) {
		this.endpoint(path, HttpMethod.GET, swaggerDef, handler, middleware, documented, postMiddleware,
			disableSerializer);
	}

	/**
	 * Register POST endpoint
	 */
	public post(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
	            documented: boolean = true, postMiddleware: ApiMiddleware[] = [], disableSerializer: boolean = true) {
		this.endpoint(path, HttpMethod.POST, swaggerDef, handler, middleware, documented, postMiddleware,
			disableSerializer);
	}

	/**
	 * Register DELETE endpoint
	 */
	public delete(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
	              documented: boolean = true, postMiddleware: ApiMiddleware[] = [], disableSerializer: boolean = true) {
		this.endpoint(path, HttpMethod.DELETE, swaggerDef, handler, middleware, documented, postMiddleware,
			disableSerializer);
	}

	/**
	 * Register HEAD endpoint
	 */
	public head(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
	            documented: boolean = true, postMiddleware: ApiMiddleware[] = [], disableSerializer: boolean = true) {
		this.endpoint(path, HttpMethod.HEAD, swaggerDef, handler, middleware, documented, postMiddleware,
			disableSerializer);
	}

	/**
	 * Register PATCH endpoint
	 */
	public patch(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
	             documented: boolean = true, postMiddleware: ApiMiddleware[] = [], disableSerializer: boolean = true) {
		this.endpoint(path, HttpMethod.PATCH, swaggerDef, handler, middleware, documented, postMiddleware,
			disableSerializer);
	}

	/**
	 * Register PUT endpoint
	 */
	public put(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
	           documented: boolean = true, postMiddleware: ApiMiddleware[] = [], disableSerializer: boolean = true) {
		this.endpoint(path, HttpMethod.PUT, swaggerDef, handler, middleware, documented, postMiddleware,
			disableSerializer);
	}

	/**
	 * Register PUT endpoint
	 */
	public options(path: string, swaggerDef: Swagger.Operation, handler: ApiHandler, middleware: ApiMiddleware[] = [],
	           documented: boolean = true, postMiddleware: ApiMiddleware[] = [], disableSerializer: boolean = true) {
		this.endpoint(path, HttpMethod.OPTIONS, swaggerDef, handler, middleware, documented, postMiddleware,
			disableSerializer);
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
	 * Start server. Call once all endpoints have been registered.
	 */
	public start(options: any): any {
		if (this.registerGeneratedRoutes != null) {
			this.registerGeneratedRoutes(this);
		}
		this.metadata.swagger = this.apiDef;
		const data = this.server.getExport(this.metadata, options);
		if (this.COMPILERMODE) {
			process.env[VALORYMETAVAR] = JSON.stringify(data);
		}
		if (!this.COMPILERMODE) {
			this.Logger.info("Valory startup complete");
		}
		return data;
	}

	/**
	 * Shuts down the server core
	 */
	public shutdown() {
		this.server.shutdown();
	}

	private endpointCompile(path: string, method: HttpMethod, swaggerDef: Swagger.Operation, handler: ApiHandler,
	                        stringMethod: HttpMethod, middleware: ApiMiddleware[] = [], documented: boolean = true,
	                        postMiddleware: ApiMiddleware[] = [], disableSerializer: boolean = true) {
		const middlewares: ApiMiddleware[] = this.globalMiddleware.concat(middleware,
			this.globalPostMiddleware, postMiddleware);
		if (!documented) {
			this.metadata.undocumentedEndpoints.push(path);
		}
		if (disableSerializer || this.server.disableSerialization) {
			this.metadata.disableSerialization.push(`${path}:${method}`);
		}
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
		swaggerDef.tags = Array.from(new Set(swaggerDef.tags));
		this.apiDef.tags = Array.from(new Set(this.apiDef.tags));
		const pathObj = this.apiDef.paths[path] || ({} as Swagger.Path);
		(pathObj as any)[stringMethod.toLowerCase()] = swaggerDef;
		this.apiDef.paths[path] = pathObj;
	}

	private endpointRun(path: string, method: HttpMethod, swaggerDef: Swagger.Operation,
	                    handler: ApiHandler, stringMethod: string, middleware: ApiMiddleware[] = [],
	                    documented: boolean = true, postMiddleware: ApiMiddleware[] = [],
	                    disableSerializer: boolean = true) {
		const validator = this.validatorModule.getValidator(path, stringMethod);
		const requestIdName = this.requestIDName;
		const route = `${path}:${stringMethod}`;
		const requestContext: RequestContext = {
			requestIdName,
			requestId: "",
			route,
		};
		if (this.apiDef.basePath != null) {
			path = this.apiDef.basePath + path;
		}
		if (validator == null) {
			throw Error("Compiled swagger is out of date. Please run valory cli");
		}
		const childLogger = this.Logger.child({endpoint: route});
		const middlewares: ApiMiddleware[] = this.globalMiddleware.concat(middleware);
		const postMiddlewares = this.globalPostMiddleware.concat(postMiddleware);
		const middlewareProcessor = (middlewares.length > 0) ? processMiddleware : noopPromise;
		const postMiddlewareProcessor = (postMiddlewares.length > 0) ? processMiddleware : noopPromise;
		const logRequest = this.logRequest;
		const logProvider = this.requestLogProvider;
		const wrapper = async (req: ApiRequest): Promise<ApiResponse> => {
			const requestId = fastUUID();
			req.putAttachment(Valory.RequestIDKey, requestId);
			requestContext.requestId = requestId;
			const requestLogger = logProvider(childLogger, requestContext);
			requestLogger.debug("Received request");
			const response: ResponseMatrix = {
				errorResponse: null,
				handlerResponse: null,
				postMiddlewareResponse: null,
				preMiddlewareResponse: null,
				validatorResponse: null,
			};
			try {
				response.preMiddlewareResponse = await middlewareProcessor(middlewares, req, requestLogger);
				if (response.preMiddlewareResponse == null) {
					const result = validator.validator(req);
					req.putAttachment(Valory.ValidationResultKey, result);
					if (result !== true) {
						response.validatorResponse = this.buildError("ValidationError", result as string[]);
					} else {
						response.handlerResponse = await handler(req, requestLogger, requestContext);
					}
				}
			} catch (error) {
				if (error.name === "ValoryEndpointError") {
					response.errorResponse = this.buildError(error.valoryErrorCode, error.message || undefined);
				} else {
					requestLogger.error(error, "Internal exception occurred while processing request");
					response.errorResponse = this.buildError("InternalError");
				}
			}
			try {
				response.postMiddlewareResponse = await postMiddlewareProcessor(postMiddlewares, req, requestLogger);
				const finalResponse = getResponse(response);
				logRequest(req, finalResponse.response, requestId);
				if (finalResponse.isHandler && !finalResponse.response.disableSerializer) {
					finalResponse.response.body = flatStr(validator.serializer(finalResponse.response.body));
				}
				finalResponse.response.headers[requestIdName] = requestId;
				return finalResponse.response;
			} catch (error) {
				requestLogger.error(error, "Internal exception occurred while processing request");
				const finalResponse = this.buildError("InternalError");
				finalResponse.headers[requestIdName] = requestId;
				return finalResponse;
			}
		};
		this.server.register(path, method, wrapper);
	}

	private registerDocSite() {
		const prefix = this.apiDef.basePath || "";
		let swaggerBlob: Swagger.Spec;
		this.server.register(prefix + "/swagger.json", HttpMethod.GET, (req) => {
			if (swaggerBlob == null) {
				swaggerBlob = JSON.parse(this.validatorModule.swaggerBlob);
				swaggerBlob.paths = fastOmit(swaggerBlob.paths, this.validatorModule.undocumentedEndpoints);
			}
			return Promise.resolve({
				body: JSON.stringify(swaggerBlob),
				headers: {"Content-Type": "text/plain"},
				statusCode: 200,
			});
		});
		this.server.register((prefix !== "") ? prefix : "/", HttpMethod.GET, (req) => {
			if (Config.DOC_HTML_PROCESSED == null) {
				Config.processDocHtml({
					APP_NAME: this.apiDef.info.title,
				});
			}
			return Promise.resolve({
				body: Config.DOC_HTML_PROCESSED,
				headers: {"Content-Type": "text/html"},
				statusCode: 200,
			});
		});
	}
}

function noopPromise(...args: any[]): Promise<null> {
	return Promise.resolve(null);
}

function processMiddleware(middlewares: ApiMiddleware[], req: ApiRequest, logger: Logger): Promise<ApiResponse | null> {
	return new Promise((resolve) => {
		let err: ApiExchange = null;
		eachSeries(null, (handler: ApiMiddleware, done) => {
			const handlerLogger = logger.child({middleware: handler.name});
			handlerLogger.debug("Running Middleware");
			handler.handler(req, handlerLogger, (error) => {
				if (error != null) {
					err = error;
					done(error);
					return;
				}

				done();
			});
		}, middlewares, (error) => {
			resolve(err as ApiResponse);
		});
	});
}

function generateErrorTable(errors: { [x: string]: ErrorDef }): Swagger.Tag {
	const tagDef: Swagger.Tag = {name: "Errors", description: ""};
	let table = ERRORTABLEHEADER;
	const keys = Object.keys(errors);
	keys.sort((a, b) => {
		const aCode = errors[a].errorCode;
		const bCode = errors[b].errorCode;

		if (aCode < bCode) {
			return -1;
		}
		if (aCode === bCode) {
			return 0;
		}
		if (aCode > bCode) {
			return 1;
		}
	});

	for (const name of keys) {
		const error = errors[name];
		table += "|" + error.errorCode + "|" + name + "|" + error.defaultMessage + "|\n";
	}
	tagDef.description = table;
	return tagDef as Swagger.Tag;
}
