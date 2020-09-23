import {
    AppendMiddleware,
    Body,
    Header,
    Post,
    PrependMiddleware,
    Route,
    SuccessResponse,
    Response,
    Query,
    Options,
    Path, Delete
} from "../server/decorators";
import {Controller} from "../server/controller";
import {ApiMiddleware} from "../lib/common/headers";
import {Get, Hidden} from "tsoa";

export interface TestInput {
    /**
     * a number prop
     * @example 2
     * @isInt
     */
    number: number;
    /**
     * @format date-time
     */
    date: string;
}

/**
 * @tsoaModel
 */
export interface PaginatedResult<A> {
    items: A[];
    /**
     * Reflects the total results, not just the total returned by a singular page of results.
     * @example 1
     */
    total: number;
    /**
     * Token used to retrieve the next page of items in the list. Present in a response only if the total available results exceeds the specified limit per page. This token does not change between requests.
     * @example "4bb1f9ab35bd"
     */
    pageNextToken?: string;
}

/**
 * @tsoaModel
 */
export interface Expression {
    /**
     * The syntax identifier for the expression engine.
     * @example "https://nrfcloud.github.io/docs/jsonata"
     */
    syntax: string;
    /**
     * A [JSONata expression](http://try.jsonata.org/B1lwqEd-Q) that specifies how the payload of a message that triggers an alert state is transformed for use in an alert notification.
     * @example {"text": "Temperature is now \" & payload.message.message.event.characteristic.parsedValues[0].value & \"°C\""}
     */
    expression: string;
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
export type OmitTestInput = Omit<TestInput, "string">;

/**
 * @pattern /^[^\/\s_]{1,128}$|^[0-a-z9:_-]{1,128}$/i
 */
export type StringAlias = string;

/**
 * @isInt test
 */
export type NumberAlias = number;

export type Complex = Omit<TestInput & {[key: string]: any}, "string">;

export interface Cool<T> {
    thing: T;
}

export enum Direction {
    ASC = "asc",
    DESC = "desc"
}

@Route()
export class TestController extends Controller {
    @PrependMiddleware(literalMiddleware)
    @Response(202)
    @SuccessResponse(313)
    @Post() public test(@Header("test-type") test: StringAlias): PaginatedResult<TestInput> {
        return {
            cool: true,
            yes: "blue"
        } as any;
    }

    @Get() public yay() {
        return "yay";
    }
}

@Route("test")
export class Test2Controller extends Controller {

    /**
     *
     * @format id date-time
     */
    @Get("{id}") public pathParamTest(@Path() id: string) {
        return id;
    }

    @Delete("{identifier}") public pathParamTest2(@Path() identifier: string) {
        return identifier;
    }
}
