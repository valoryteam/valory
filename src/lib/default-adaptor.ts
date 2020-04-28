import {ApiContext} from "./common/context";
import {HttpMethod, ApiAdaptor} from "./common/headers";
import {IncomingMessage, ServerResponse} from "http";
import P = require("pino");

const polka = require("polka");
const pathReplacer = /{([\S]*?)}/g;

export class DefaultAdaptor implements ApiAdaptor {
    private server = polka();
    private port = 8080;
    private host?: string;
    private logger = P();

    constructor(port?: number, host?: string) {
        this.port = +process.env.PORT || port;
        this.host = process.env.HOST || host;
    }

    public register(path: string, method: HttpMethod, handler: (ctx: ApiContext) => Promise<ApiContext>) {
        const formattedPath = path.replace(pathReplacer, ":$1");
        this.server.add(method, formattedPath, (req: IncomingMessage, res: ServerResponse) => {
            let rawBody: string = "";

            req.on("data", (chunk: Buffer) => {
                rawBody += chunk.toString();
            });

            req.on("end", async () => {
                const ctx = new ApiContext({
                    headers: req.headers,
                    pathParams: (req as any).params,
                    url: req.url,
                    method,
                    rawBody,
                });

                await handler(ctx);
                res.writeHead(ctx.response.statusCode, ctx.prepareHeaders());
                res.end(ctx.serializeResponse());
            });
        });
    }

    public start() {
        this.server.listen(this.port, this.host);
    }

    public shutdown() {
        this.server.close();
    }
}
