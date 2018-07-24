import {
	ApiRequest,
	Body,
	Header,
	Post,
	Route,
	Request,
	Controller,
	Logger,
	Middleware,
	ApiMiddleware,
	Valory, ApiError, Hidden,
} from "../main";
import * as P from "pino";
type Logger = P.Logger;

/**
 * @example {"name": "test", "content": "yay"}
 * @swagger {"properties": {"name": {"maxLength": 8}}}
 */
interface Burn {
	name: string;
	content: string;
	powerlevel?: number;
}

const TestMiddleware: ApiMiddleware = {
	tag: {
		name: "GTFO",
		description: "Access denied on this resource",
	},
	name: "TestMiddleware",
	handler: (req, logger, done) => {
		req.getAttachment(Valory.ResponseKey);
		// done(api.buildError("AccessDenied"));
		done();
	},
};

@Route("burn")
export class BurnRoutes {
	/**
	 *
	 * @param {Burn} burn
	 * @param {ApiRequest} req
	 * @param {Logger} logger
	 * @returns {string}
	 */
	@Middleware(TestMiddleware)
	@Hidden()
	@Post()
	public submit(@Body() burn: Burn, @Request() req: ApiRequest, @Logger() logger: Logger): string {
		throw ApiError("AccessDenied", "GTFO");
		// return "thing";
	}
}
