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

type ArrTest = string;

interface TestResponse<T> {
	status_code: number;
	/** @default test */
	response_data: T;
}

export class Burn {
	/** @minLength 3 */
	public name: string = "steven";
	public content: string;
	public powerlevel?: number;
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
	@Hidden()
	@Post()
	public submit(@Body() burn: Burn, @Request() req: ApiRequest, @Logger() logger: Logger): TestResponse<Burn[]> {
		throw ApiError("AccessDenied", "GTFO");
		// return "thing";
	}
}
