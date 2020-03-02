import {ApiResponse, ApiServer, HttpMethod, ValoryMetadata} from "../server/valoryheaders";
import {IncomingMessage, ServerResponse} from "http";
import qs = require("querystring");
import url = require("url");
import {ApiRequest} from "../server/request";

const pathReplacer = /{([\S]*?)}/g;
const polka = require("polka");

export class DefaultAdaptor implements ApiServer {
    public allowDocSite = true;
    public disableSerialization = false;
    public locallyRunnable = true;
    private server = polka();

    public register(path: string, method: HttpMethod, handler: (request: ApiRequest) => (Promise<ApiResponse>)) {
        const route = `${path}:${HttpMethod[method]}`;
        path = path.replace(pathReplacer, ":$1");
        this.server.add(HttpMethod[method], path, (req: IncomingMessage, res: ServerResponse) => {
            let rawBody: string;

            req.on("data", (chunk: Buffer) => {
                rawBody = chunk.toString();
            });

            req.on("end", () => {
                const parsedUrl = url.parse(req.url, true);
                const body = attemptParse(req.headers["content-type"], rawBody);
                const transReq = new ApiRequest({
                    headers: req.headers,
                    query: parsedUrl.query,
                    path: (req as any).params,
                    route,
                    body,
                    rawBody,
                    formData: body as any,
                });

                handler(transReq).then((response) => {
                    const resContentType = response.headers["Content-Type"] || "text/plain";
                    res.writeHead(response.statusCode, response.headers);
                    res.end(serialize(resContentType, response.body));
                });
            });
        });
    }

    public getExport(metadata: ValoryMetadata, options: any): {valory: ValoryMetadata} {
        this.server.listen(options.port || process.env.PORT, options.host || process.env.HOST);
        return {valory: metadata};
    }

    public shutdown() {
        this.server.close();
    }
}

function attemptParse(contentType: string, obj: any): any {
    if (contentType == null) {
        return obj;
    }
    const parsedContentType = contentType.split(";")[0];
    try {
        switch (parsedContentType) {
            case "application/json":
                return JSON.parse(obj);
            case "application/x-www-form-urlencoded":
                return qs.parse(obj);
            default:
                return obj;
        }
    } catch (err) {
        return obj;
    }
}

function serialize(contentType: string, data: any): string {
    if (data == null) {
        return "";
    } else if (typeof data !== "string") {
        return JSON.stringify(data);
    } else {
        return data;
    }
}
