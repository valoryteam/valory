import {ApiRequest, Body, Header, Post, Route, Request} from "../main";

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
	@Post("/test")
	public test(@Header() name: string) {

	}
}
