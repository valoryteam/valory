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
	Valory,
} from "../main";
import * as P from "pino";
type Logger = P.Logger;

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
	@Middleware(TestMiddleware)
	@Post()
	public submit(@Body() burn: Burn, @Request() req: ApiRequest, @Logger() logger: Logger): string {
		return "thing";
	}
}
