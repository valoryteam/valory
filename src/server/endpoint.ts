import {Valory} from "./valory";
import {ApiMiddleware, HttpMethod, lowercaseHttpMethod} from "../lib/common/headers";
import {OpenAPIV3} from "openapi-types";
import {AsyncSeries} from "../lib/async-series";
import {ApiContext} from "../lib/common/context";
import {Logger} from "pino";
import {AttachmentRegistry} from "../lib/common/attachment-registry";
import {RequestValidator} from "./middleware/request-validator";
import {arrayPush} from "../lib/common/util";

const NOOP_HOOK: RequestExecutorNamespaceHook = (ctx, executor) => executor.execute(ctx);

export type RequestExecutorNamespaceHook = (ctx: ApiContext, executor: AsyncSeries<ApiContext, any>) => Promise<void>;

export class Endpoint {
    public static readonly ExceptionKey = AttachmentRegistry.createKey<Error>();
    public static readonly RequestLoggerKey = AttachmentRegistry.createKey<Logger>();
    public static readonly HandlerLoggerKey = AttachmentRegistry.createKey<Logger>();
    // public static requestExecutorNamespaceHook: RequestExecutorNamespaceHook = NOOP_HOOK;

    private executor: AsyncSeries<ApiContext, ApiMiddleware>;
    private middleware: ApiMiddleware[] = [];
    private logger: Logger;

    constructor(
        private valory: Valory,
        public path: string,
        public method: HttpMethod,
    ) {
        this.logger = valory.logger.child({path, method});
        this.addDefaultPreMiddleware();
    }

    private registerEndpoint() {
        this.valory.adaptor.register(this.path, this.method, this.handleRequest.bind(this));
    }

    private buildExecutor() {
        this.executor = new AsyncSeries(
            this.middleware,
            (arg: ApiContext, i: number) => {
                const handlerLogger = arg.attachments.getAttachment(Endpoint.RequestLoggerKey).child({middleware: this.middleware[i].name});
                arg.attachments.putAttachment(Endpoint.HandlerLoggerKey, handlerLogger);
            },
            (arg, err, i) => {
                arg.attachments.putAttachment(Endpoint.ExceptionKey, err);
            });
    }

    public async handleRequest(ctx: ApiContext): Promise<ApiContext> {
        const requestLogger = this.logger.child({requestId: ctx.requestId});
        ctx.attachments.putAttachment(Endpoint.RequestLoggerKey, requestLogger);
        await this.executor.execute(ctx);
        return ctx;
    }

    public appendMiddleware(middleware: ApiMiddleware) {
        return this.aM(middleware);
    }

    public aM(middleware: ApiMiddleware) {
        this.middleware.push(middleware);
        return this;
    }

    public appendMiddlewareList(middlewares: ApiMiddleware[]) {
        return this.aML(middlewares);
    }

    public aML(middlewares: ApiMiddleware[]) {
        this.middleware = arrayPush(this.middleware, middlewares);
        return this;
    }

    public addDefaultPreMiddleware() {
        this.appendMiddleware(new RequestValidator(this.valory, this.path, this.method));
        this.appendMiddlewareList(this.valory.beforeAllMiddleware);
    }

    public addDefaultPostMiddleware() {
        this.appendMiddlewareList(this.valory.afterAllMiddleware);
    }

    public done() {
        this.addDefaultPostMiddleware();
        this.registerEndpoint();
        this.buildExecutor();
    }
}
