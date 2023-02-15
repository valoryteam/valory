import { ApiAdaptor, ApiContext, HttpHeaders, HttpMethod } from '../public/index.js';
import {Server} from 'http';
import {URL} from 'url'
export interface IHttpAdaptorOptions {
  port: number;
  host?: string;
}
export class HttpAdaptor extends ApiAdaptor {
  private readonly server: Server;

  constructor(private readonly options: IHttpAdaptorOptions) {
    super();

    this.server = new Server(
      (req, res) => {
        let rawBody: string = "";
        const url = new URL(req.url || "");
        const method = req.method as HttpMethod | undefined

        if (method == null) {
          res.end();
          return;
        }

        req.on("data", (chunk: Buffer) => {
          rawBody += chunk.toString();
        });

        req.on("end", async () => {
          const ctx = new ApiContext({
            headers: req.headers as HttpHeaders,
            path: url.pathname,
            method,
            rawBody,
            queryParams: Object.fromEntries(url.searchParams)
          });

          await this.handleRequest(ctx);
          res.writeHead(ctx.response.statusCode, ctx.prepareHeaders());
          res.end(ctx.serializeResponse());
        });
      });
  }

  public start() {
    this.server.listen(this.options.port, this.options.host);
  }

  public shutdown() {
    this.server.close();
  }
}
