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
	Valory, ApiError, Hidden, Query, PostMiddleware, Get, Path, BodyProp, DisableSerialization, Options,
	Response,
} from "../main";

export interface TestResponse<T> {
    status_code: number;
    /** @default test */
    response_data: T;
}

export class Burn {
    /** @minLength 3 */
    public name: string = "steven";
    public "🖕" ? = "😨";
    public powerlevel?: number;
    public array: ArrayAlias;
    public string: StringAlias;
    public alias: AliasAlias;
    public literalEnum: LiteralEnum;
    public literal: LiteralAlias;
    public literalNum: LiteralNum;
	public readonly id: string;
}

export class TestObj {
    /**
     * @example "nested example"
     */
    public thing: string;
    public otherThing: number;
    public nested: {
        /**
         * nestedprop description
         * @example "nested prop exmaple"
         */
        nestedProp: string;
        nestedObj: {
            num: number;
        };
    } = {
    	nestedObj: {
    		num: 2,
	    },
	    nestedProp: "stuff",
    };
}

export class ExtTest extends TestObj {
	public extProp: string;
	/**
	 * @format url
	 */
	public url: string;
}

export type ArrayAlias = number[];
// export type TupleAlias = [number, number];
/**
 * alias to a string
 * @example a string
 * @minLength 3
 * @pattern [abc].*z
 */
export type StringAlias = string;
export type AliasAlias = StringAlias;
export type LiteralAlias = "test";
export type LiteralEnum = "thing" | "otherthing";
export type LiteralNum = 2;

export const enum ComputedEnum {
	test = "test",
	other = "thing",
}

export interface SimpleExampleTest {
    /**
     * @example 34
     */
    test: number;
}

const TestMiddleware: ApiMiddleware = {
    tag: {
        name: "GTFO",
        description: "Access denied on this resource",
    },
    name: "TestMiddleware",
    handler: (req, logger, done) => {
        done({statusCode: 333, headers: {}, body: req.getAttachment(Valory.ResponseKey)});
    },
};

/**
 * Parent type description
 */
export type ParentType = ChildType | OtherChildType;

/**
 * ChildType description
 */
export interface ChildType {
    dtype: "ChildType";
	/**
	 * Phone number (No country code)
	 * @example "3214249450"
	 * @pattern `^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$`
	 */
    thing: string;
    constant: "yay";
    test: ComputedEnum;
	/**
	 * @multipleOf 2
	 */
	num: number;
	/**
	 * Override description
	 */
	// indexed: TestObj["nested"];
}

export interface OtherChildType {
    dtype: "OtherChildType";
    other: number;
    enum: ComputedEnum;
    // stuff: TestObj["nested"];
}

export type ApiResAsync<T> = Promise<ApiRes<T>>;

export interface NestedGeneric<T> {
    data: ApiRes<T>;
}

export interface GenericType<T> {
	common: string;
	generic: T;
}

export interface ApiRes<T> {
    status_code: 1;
    response_data: T;
}

@Route("/")
export class BurnRoutes extends Controller {
	/**
	 * @return {ApiRes<string>} A success response
	 */
	@Post("/other/{thing}/")
	public test(@Path() thing: StringAlias, @Body() input: ParentType): ApiRes<ApiRes<ApiRes<{stuff?: boolean}>>> {
		this.logger.info("A thing has happen");
		return {status_code: 1, response_data: {status_code: 1, response_data: {status_code: 1, response_data: {}}}};
	}

	@Post("submit/generic/literal")
	public submitGenericLiteral(@Body() genericInput: {literal1: GenericType<{potato: "thing" | "TestObj", nested: {meat: string}}>, literal2: GenericType<{other: string}>}) {
		return genericInput;
	}
}

@Route("thing")
export class ThingRoutes extends Controller {
    // @PostMiddleware(TestMiddleware)
    @Get()
	@Response(400, "Explosion")
    public yay(): {thing: "yay"} {
        this.logger.info("yay");
        return this.buildError("AccessDenied");
        return {
            thing: "yay",
        };
    }

    @Post("other/{test}")
    public test(@Path() test: StringAlias, @Body() input: ExtTest): ApiRes<Burn> {
        return {status_code: 1, response_data: {alias: "stuff", array: [], string: "", literal: "test", literalEnum: "otherthing", id: "id", powerlevel: 20, literalNum: 2, name: ""}};
    }

    @Options("*")
	public cors() {
    	this.setHeader("access-control-allow-origin", "*");
    }
}

type func = (test: string) => number;
