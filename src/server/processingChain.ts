import {eachSeries, compose} from "../lib/async";
import {Logger} from "pino";
import {Validator} from "../compiler/compilerheaders";
import {ApiRequest} from "./request";
import {Valory} from "./valory";
import {ApiHandler, ApiMiddleware, ApiResponse, RequestLogProvider} from "./valoryheaders";
const uuid = require("hyperid")();

/** @hidden */
export interface RequestProcessingContextConstants {
	readonly valory: Valory;
	readonly validator: Validator;
	readonly middleware: ApiMiddleware[];
	readonly postMiddleware: ApiMiddleware[];
	readonly parentLogger: Logger;
	readonly handler: ApiHandler;
	readonly logProvider: RequestLogProvider;
	readonly route: string;
}

interface RequestProcessingContextInternal {
	readonly preMiddlewareProcessor: typeof processMiddleware;
	readonly postMiddlewareProcessor: typeof processMiddleware;
}

interface RequestProcessingContextBase {
	readonly constants: RequestProcessingContextConstants;
	readonly internal: RequestProcessingContextInternal;
	locals: {
		exceptionOccurred: boolean
		exception: Error
		request: ApiRequest;
		response: ApiResponse;
		responseSent: boolean;
		requestId: string;
		requestLogger: Logger;
		handlerResponded: boolean;
	};
	stage: string;
}

function transition<T extends RequestProcessingContext>(ctx: RequestProcessingContextBase, stage: T["stage"]): T {
	ctx.stage = stage;
	return ctx as any;
}

type RequestProcessingContext =
	PreHandlerMiddlewareContext |
	HandlerContext |
	PostHandlerMiddlewareContext |
	ExceptionFilterContext;

interface PreHandlerMiddlewareContext extends RequestProcessingContextBase {
	stage: "PreHandlerMiddleware";
}

function processPreHandlerMiddleware(ctx: RequestProcessingContext, done: (err: Error, data: PreHandlerMiddlewareContext) => void) {
	const lctx = transition(ctx, "PreHandlerMiddleware") as PreHandlerMiddlewareContext;
	try {
		lctx.internal.preMiddlewareProcessor(ctx.constants.middleware, ctx.locals.request, ctx.locals.requestLogger, (err) => {
			if (err != null) {
				ctx.locals.responseSent = true;
				ctx.locals.response = err;
			}
			done(null, lctx);
		});
	} catch (err) {
		lctx.locals.exceptionOccurred = true;
		lctx.locals.exception = err;
		done(null, lctx);
	}
}

interface HandlerContext extends RequestProcessingContextBase {
	stage: "Handler";
}

function processHandler(ctx: RequestProcessingContext, done: (err: Error, data: HandlerContext) => void) {
	const lctx = transition(ctx, "Handler") as HandlerContext;
	if (lctx.locals.responseSent || lctx.locals.exceptionOccurred) {
		done(null, lctx);
		return;
	}
	const request = lctx.locals.request;
	const validationResult = lctx.constants.validator(request);
	request.putAttachment(Valory.ValidationResultKey, validationResult);
	if (validationResult === true) {
		Promise.resolve(lctx.constants.handler(request, lctx.locals.requestLogger)).then((res: ApiResponse) => {
			lctx.locals.responseSent = true;
			lctx.locals.response = res;
			lctx.locals.handlerResponded = true;
			done(null, lctx);
			return;
		}, (err: Error) => {
			lctx.locals.exception = err;
			lctx.locals.exceptionOccurred = true;
			done(null, lctx);
		});
	} else {
		lctx.locals.response = lctx.constants.valory.buildError("ValidationError", validationResult as string[]);
		done(null, lctx);
		return;
	}
}

interface ExceptionFilterContext extends RequestProcessingContextBase {
	stage: "ExceptionFilter";
}

function exceptionFilter(ctx: RequestProcessingContext, done: (err: Error, data: ExceptionFilterContext) => void) {
	const lctx = transition(ctx, "ExceptionFilter") as ExceptionFilterContext;
	if (lctx.locals.exceptionOccurred) {
		lctx.locals.exceptionOccurred = false;
		lctx.locals.handlerResponded = false;
		lctx.locals.requestLogger.error("Internal exception occurred while processing request");
		lctx.locals.requestLogger.error(lctx.locals.exception);
		lctx.locals.response = lctx.constants.valory.buildError("InternalError");
	}
	done(null, lctx);
}

interface PostHandlerMiddlewareContext extends RequestProcessingContextBase {
	stage: "PostHandlerMiddleware";
}

function processPostHandlerMiddleware(ctx: PostHandlerMiddlewareContext, done: (err: Error, data: PostHandlerMiddlewareContext) => void) {
	const lctx = transition(ctx, "PostHandlerMiddleware") as PostHandlerMiddlewareContext;
	const request = lctx.locals.request;
	request.putAttachment(Valory.ResponseKey, lctx.locals.response);
	request.putAttachment(Valory.HandlerResponded, lctx.locals.handlerResponded);
	try {
		lctx.internal.postMiddlewareProcessor(ctx.constants.postMiddleware, ctx.locals.request, ctx.locals.requestLogger, (err) => {
			if (err != null) {
				ctx.locals.responseSent = true;
				ctx.locals.response = err;
			}
			done(null, lctx);
		});
	} catch (err) {
		lctx.locals.exceptionOccurred = true;
		lctx.locals.exception = err;
		done(null, lctx);
	}
}

function finalProcess(ctx: RequestProcessingContextBase, done: (err: Error, res: ApiResponse) => void) {
	const res = ctx.locals.response;
	res.headers[ctx.constants.valory.requestIDName] = ctx.locals.requestId;
	done(null, res);
}

function processMiddleware(middlewares: ApiMiddleware[],
                           req: ApiRequest, logger: Logger, callback: (error: ApiResponse | null) => void) {
	// let err: ApiExchange = null;
	eachSeries(middlewares, (handler: ApiMiddleware, done) => {
		const handlerLogger = logger.child({middleware: handler.name});
		handlerLogger.debug("Running Middleware");
		handler.handler(req, handlerLogger, done);
	}, callback);
}

const ProcessingChain = Promise.promisify(compose(
	finalProcess,
	exceptionFilter,
	processPostHandlerMiddleware,
	exceptionFilter,
	processHandler,
	processPreHandlerMiddleware,
) as any) as any;

const DefaultException: Error = {message: "", name: "", stack: ""};
const DefaultResponse: ApiResponse = {statusCode: 200, disableSerializer: true, headers: {}, body: {}};

/** @hidden */
export function buildHandlerChain(constants: RequestProcessingContextConstants)
	: (request: ApiRequest) => ApiResponse | Promise<ApiResponse> {
	const internal: RequestProcessingContextInternal = {
		preMiddlewareProcessor: (constants.middleware.length > 0) ? processMiddleware : noopCb,
		postMiddlewareProcessor: (constants.postMiddleware.length > 0) ? processMiddleware : noopCb,
	};

	return (req: ApiRequest) => {
		const id = uuid();
		const context: RequestProcessingContextBase = {
			stage: "",
			constants,
			internal,
			locals: {
				requestId: id,
				response: DefaultResponse,
				exceptionOccurred: false,
				exception: DefaultException,
				handlerResponded: false,
				requestLogger: constants.logProvider(constants.parentLogger, {
					requestId: id,
					requestIdName: constants.valory.requestIDName,
					route: constants.route,
				}),
				responseSent: false,
				request: req,
			},
		};
		req.putAttachment(Valory.RequestIDKey, id);
		return ProcessingChain(context);
	};
}

function noopCb(...args: any[]) {
	args[args.length - 1]();
}
