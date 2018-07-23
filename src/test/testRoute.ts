import {Get, Header, Post, Route, Body, ApiError} from "../main";

@Route("test") export class TestRoute {
	@Get() public test(@Header() authorization: string) {

		return {message: "yay"};
	}

	@Post("submit") public submit(@Body() item: {name: string, isCool: boolean}) {
		return `${item.name} is ${(item.isCool) ? "cool" : "not cool"}`;
	}

	@Get("error") public error() {
		throw ApiError("TestError");
	}
}
