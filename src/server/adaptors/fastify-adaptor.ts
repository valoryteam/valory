import {ApiExchange, ApiServer, HttpMethod, ValoryMetadata} from "../valory";
import {FastifyInstance, HTTPMethod} from "fastify";
import {IncomingMessage, ServerResponse, Server} from "http";
import fastify = require("fastify");
const formBody = require("fastify-formbody");
const intern = require("fast.js/string/intern");
const pathReplacer = /{([\S]*?)}/g;

export class FastifyAdaptor implements ApiServer {
	public readonly allowDocSite: boolean = true;
	private instance: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({});
	constructor() {
		this.instance.register(formBody);
	}
	public register(path: string, method: HttpMethod,
					handler: (request: ApiExchange) => ApiExchange | Promise<ApiExchange>) {
		path = intern(path.replace(pathReplacer, ":$1"));
		this.instance.route({
			method: HttpMethod[method] as HTTPMethod,
			url: path,
			handler: async (req, res) => {
				// FIXME: setting both formData and body is lazy, need a better solution
				const transRequest: ApiExchange = {
					headers: req.req.headers as {[key: string]: any},
					body: req.body,
					formData: req.body,
					query: req.query,
					path: req.params,
					statusCode: 0,
				};

				const response = await handler(transRequest);
				res.code(response.statusCode);
				(res as any).headers(response.headers);
				res.send(response.body);
			},
		});
	}

	public getExport(metadata: ValoryMetadata, options: any): {valory: ValoryMetadata} {
		this.instance.listen(options.port);
		return {valory: metadata};
	}

	public shutdown() {
		this.instance.server.close();
	}
}
