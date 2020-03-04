import {Valory} from "./valory";
import {HttpMethod, lowercaseHttpMethod} from "../lib/common/headers";
import {OpenAPIV3} from "openapi-types";
import {AsyncSeries} from "../lib/async-series";
import {ApiContext} from "../lib/common/context";
import {Logger} from "pino";
import {ApiMiddleware, ApiMiddlewareExecutor} from "../lib/common/middleware";
import {AttachmentRegistry} from "../lib/common/attachment-registry";

export class Endpoint {
    public static readonly RequestLoggerKey = AttachmentRegistry.createKey<Logger>();
    public static readonly HandlerLoggerKey = AttachmentRegistry.createKey<Logger>();

    private executor: AsyncSeries<ApiContext>;
    private middleware: {middleware: ApiMiddleware, priority: number}[] = [];
    private logger: Logger;

    constructor(
        private valory: Valory,
        public path: string,
        public method: HttpMethod,
        public operation: OpenAPIV3.OperationObject
    ) {
        this.logger = valory.logger.child({path, method})
    }

    private registerSwagger() {
        const paths = this.valory.apiDef.paths[this.path] || {};
        paths[lowercaseHttpMethod(this.method)] = this.operation;
    }

    private registerEndpoint() {
        this.valory.adaptor.register(this.path, this.method, this.handleRequest.bind(this))
    }

    private buildExecutor() {
        const handlerAccum: {function: ApiMiddlewareExecutor, priority: number}[] = [];
        for (let i = 0; i < this.middleware.length; i++) {
            handlerAccum.push({function: this.middleware[i].middleware.handler, priority: this.middleware[i].priority})
        }
        this.executor = new AsyncSeries<ApiContext>(
            handlerAccum,
            (arg, i) => {
                const handlerLogger = arg.attachments.getAttachment(Endpoint.RequestLoggerKey).child({middleware: this.middleware[i].middleware.name});
                arg.attachments.putAttachment(Endpoint.HandlerLoggerKey, handlerLogger);
            },
            (arg, err, i) => {
                // TODO: Figure out error handling
            })
    }

    public async handleRequest(ctx: ApiContext): Promise<ApiContext> {
        const requestLogger = this.logger.child({requestId: ctx.requestId});
        ctx.attachments.putAttachment(Endpoint.RequestLoggerKey, requestLogger);
        await this.executor.execute(ctx);
        return ctx;
    }

    public addMiddleware(middleware: ApiMiddleware, priority: number) {
        this.middleware.push({middleware, priority});
        return this
    }

    public done() {
        this.registerEndpoint();
        this.registerSwagger();
        this.buildExecutor();
    }
}
