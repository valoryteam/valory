import { ApiContext } from '../public/context.js';
import { ApiMiddleware, ExceptionKey, HttpMethod } from '../public/types.js';
import { AsyncSeries } from './async-series.js';
import { Valory } from '../public/valory.js';
import { arrayPush } from './util.js';

const NOOP_HOOK: RequestExecutorNamespaceHook = (ctx, executor) => executor.execute(ctx);

export type RequestExecutorNamespaceHook = (ctx: ApiContext, executor: AsyncSeries<ApiContext, any>) => Promise<void>;

export class Endpoint {
  private executor?: AsyncSeries<ApiContext, ApiMiddleware>;
  private middleware: ApiMiddleware[] = [];

  constructor(
    private valory: Valory,
    public path: string,
    public method: HttpMethod,
  ) {
    this.addDefaultPreMiddleware();
  }

  private registerEndpoint() {
    this.valory.adaptor.register(this.path, this.method, this.handleRequest.bind(this));
  }

  private buildExecutor() {
    this.executor = new AsyncSeries(
      this.middleware,
      (arg: ApiContext, exec, i: number) => {
        if (exec.filter) {
          if (exec.filter.mustExclude) {
            if (arg.attachments.hasAnyAttachments(exec.filter.mustExclude))
              return false;
          }
          if (exec.filter.mustInclude) {
            if (!arg.attachments.hasAllAttachments(exec.filter.mustInclude))
              return false;
          }
        }
        return true;
      },
      (arg, err, i) => {
        arg.attachments.putAttachment(ExceptionKey, err);
      });
  }

  public async handleRequest(ctx: ApiContext): Promise<void> {
    if (this.executor == null) {
      throw new Error("Endpoint executor is not built. Did you forget to call 'done()'?");
    }

    await this.executor.execute(ctx);
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
