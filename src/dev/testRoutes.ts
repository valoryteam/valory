import {AppendMiddleware, Body, Header, Post, PrependMiddleware, Route, SuccessResponse, Response, Query} from "../server/decorators";
import {Controller} from "../server/controller";
import {ApiMiddleware} from "../lib/common/middleware";

export interface TestInput {
    /**
     * a number prop
     * @example 2
     * @isInt
     */
    number: number;
    string: EndpointArgs[];
}

export interface EndpointArgsURL {
    type: 'https://nrfcloud.github.io/docs/webhook';
    url: string;
}

export interface EndpointArgsSMS {
    type: 'https://nrfcloud.github.io/docs/sms';
    number: string;
}

export type EndpointArgs = EndpointArgsSMS | EndpointArgsURL;

export const literalMiddleware: ApiMiddleware = {
    name: "LiteralMiddleware",
    handler(ctx) {
        ctx.response.headers["request-id"] = ctx.requestId;
    }
};

/**
 * A omitted type
 * @example {"number": 2}
 */
export type OmitTestInput = Omit<TestInput, "string">

/**
 * @format email
 */
export type StringAlias = string;

/**
 * @isInt test
 */
export type NumberAlias = number;

export type Complex = Omit<TestInput & {[key: string]: any}, "string">

export enum Direction {
    ASC = "asc",
    DESC = "desc"
}

@Route()
export class TestController extends Controller {
    @PrependMiddleware(literalMiddleware)
    @Response(202)
    @SuccessResponse(313)
    @Post() public test(@Body() enumTest: TestInput) {
        // this.setHeader("content-type", "text/plain");
        return {
            cool: true,
            yes: "blue"
        }
    }
}
