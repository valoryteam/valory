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
	Valory, ApiError, Hidden, Query, PostMiddleware, Get, Path, BodyProp, DisableSerialization,
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
    public "🖕" = "😨";
    public powerlevel?: number;
    public array: ArrayAlias;
    public string: StringAlias;
    public alias: AliasAlias;
    public literalEnum: LiteralEnum;
    public literal: LiteralAlias;
    public literalNum: LiteralNum;
}

export type ArrayAlias = number[];
// export type TupleAlias = [number, number];
/**
 * alias to a string
 * @example a string
 * @minLength 3
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
     * @example "joe"
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
	indexed: TestObj["nested"];
}

export interface OtherChildType {
    dtype: "OtherChildType";
    other: number;
}

export interface ApiRes<T> {
    status_code: 1;
    response_data: T;
}

export type ApiResAsync<T> = Promise<ApiRes<T>>;

export interface NestedGeneric<T> {
    data: ApiRes<T>;
}

@Route("/")
export class BurnRoutes extends Controller {
	/**
	 * @return {ApiRes<string>} A success response
	 */
	@Post("/other/{thing}/")
	public test(@Path() thing: StringAlias, @Body() input: ParentType): ApiRes<{stuff: boolean}> {
		this.logger.info("A thing has happen");
		return {status_code: 1, response_data: {stuff: true}};
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

    @Post("other")
    public test(@Body() input: Burn): ApiRes<string[]> {
        return {status_code: 1, response_data: ["yay"]};
    }
}

type func = (test: string) => number;
