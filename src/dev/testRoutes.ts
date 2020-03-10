import {AppendMiddleware, Body, Header, Post, PrependMiddleware, Route} from "../server/decorators";
import {Controller} from "../server/controller";
import {ApiMiddleware} from "../lib/common/middleware";

export interface TestInput {
    number: number;
    string: string;
}

export const literalMiddleware: ApiMiddleware = {
    name: "LiteralMiddleware",
    handler(ctx) {
        ctx.response.headers["request-id"] = ctx.requestId;
    }
};

@Route()
export class TestController extends Controller {
    @PrependMiddleware(literalMiddleware)
    @Post() public test(@Body() input: TestInput, @Header("cool-header") coolHeader: string) {
        this.setHeader("content-type", "text/plain");
        return `number is ${input.number}`;
    }
}
