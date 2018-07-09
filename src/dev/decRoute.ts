import {ApiRequest, Body, Header, Post, Route, Request, Controller} from "../main";

interface Burn {
	name: string;
	content: string;
	powerlevel?: number;
}

@Route("burn")
export class BurnRoutes {
	@Post()
	public submit(@Body() burn: Burn, @Request() req: ApiRequest): string {
		return "thing";
	}
}
