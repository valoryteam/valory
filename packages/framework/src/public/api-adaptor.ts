import { ApiContext } from './context.js';
import { ApiResponse, HttpMethod } from './types.js';
import Trouter from 'trouter'

type ApiHandler = (ctx: ApiContext) => Promise<void>;
export abstract class ApiAdaptor {
  private notFoundResponse: ApiResponse = {
    statusCode: 404,
    headers: {},
    body: 'Not Found'
  }
  private readonly router = new Trouter<ApiHandler>();
  /**
   * @internal
   */
  public register(path: string, method: HttpMethod, handler: ApiHandler) {
    this.router.add(method, path, handler);
  }

  public setNotFoundResponse(res: ApiResponse) {
    this.notFoundResponse = res;
  }
  readonly handleRequest = async (ctx: ApiContext) => {
    const {handlers, params} = this.router.find(ctx.request.method, ctx.request.path);
    const handler = handlers.pop()
    if (handler != null) {
      await handler(ctx)
      return
    }
    ctx.response = this.notFoundResponse
  }

  /**
   * Startup underlying server
   */
  abstract start(): any;

  abstract shutdown(): void;
}
