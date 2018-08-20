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
    Valory, ApiError, Hidden, Query, PostMiddleware, Get, Path, BodyProp,
} from "../main";

export interface TestResponse<T> {
    status_code: number;
    /** @default test */
    response_data: T;
}

export class Burn {
    /** @minLength 3 */
    public name: string = "steven";
    public content: string;
    public powerlevel?: number;
    // public tuple: TupleAlias;
    public array: ArrayAlias;
    public string: StringAlias;
    public alias: AliasAlias;
    // public object: ObjectAlias;
    public literalEnum: LiteralEnum;
    public literal: LiteralAlias;
    public literalNum: LiteralNum;
}

export type ArrayAlias = number[];
// export type TupleAlias = [number, number];
/**
 * alias to a string
 * @example "a string"
 * @minLength 3
 */
export type StringAlias = string;
export type AliasAlias = StringAlias;
export type LiteralAlias = "test";
export type LiteralEnum = "thing" | "otherthing";
export type LiteralNum = 2;

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
 * @swagger {"discriminator": "dtype"}
 */
export class ParentType {
    public dtype: string;
    // public implementations?: ChildType | OtherChildType;
}

/**
 * @swagger {"allOf": [{"$ref": "#/definitions/ParentType"}]}
 */
export interface ChildType {
    thing: string;
}

/**
 * @swagger {"allOf": [{"$ref": "#/definitions/ParentType"}]}
 */
export interface OtherChildType {
    other: number;
}

@Route("burn")
export class BurnRoutes extends Controller {

    /**
     *
     * @param thing test
     */
    @Post("other/{thing}")
    public test(@Path() thing: string, @BodyProp() testObj: TestObj, @BodyProp() exampleTest: SimpleExampleTest) {
        // if (input.dtype === "OtherChildType") {
        //     return input.other;
        // } else {
        //     return input.thing;
        // }
        return "yay";
    }
}

type func = (test: string) => number;
