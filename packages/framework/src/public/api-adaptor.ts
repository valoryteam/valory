import { ApiContext } from './context.js';
import { ApiRequest, ApiResponse, HttpHeaders, HttpMethod } from './types.js';
import Trouter from 'trouter'
import { AttachmentRegistry } from './attachment-registry.js';

type ApiHandler = (ctx: ApiContext) => Promise<void>;

export type ApiAdaptorRequest = {
  method: HttpMethod;
  rawPath: string;
  rawBody: string;
  headers: HttpHeaders;
}
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
  readonly handleRequest = async (req: ApiAdaptorRequest, meta?: {requestId?: string, attachments: AttachmentRegistry}): Promise<ApiContext> => {
    const url = new URL(req.rawPath);
    const path = url.pathname;
    const queryParams = Object.fromEntries(url.searchParams);
    const {handlers, params} = this.router.find(req.method, path);
    const ctx = new ApiContext({
      queryParams,
      method: req.method,
      headers: req.headers,
      path,
      pathParams: params,
      rawBody: req.rawBody,
    }, {
      requestId: meta?.requestId,
      attachments: meta?.attachments
    });
    const handler = handlers.pop()
    if (handler != null) {
      await handler(ctx)
      return ctx;
    }
    ctx.response = this.notFoundResponse;
    return ctx;
  }

  /**
   * Startup underlying server
   */
  abstract start(): any;

  abstract shutdown(): void;
}
