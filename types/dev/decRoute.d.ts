import { ApiRequest, Controller } from "../main";
export interface TestResponse<T> {
    status_code: number;
    /** @default test */
    response_data: T;
}
export declare class Burn {
    /** @minLength 3 */
    name: string;
    content: string;
    powerlevel?: number;
    array: ArrayAlias;
    string: StringAlias;
    alias: AliasAlias;
    literalEnum: LiteralEnum;
    literal: LiteralAlias;
    literalNum: LiteralNum;
}
export declare type ArrayAlias = number[];
/**
 * alias to a string
 * @example "a string"
 * @minLength 3
 */
export declare type StringAlias = string;
export declare type AliasAlias = StringAlias;
export declare type LiteralAlias = "test";
export declare type LiteralEnum = "thing" | "otherthing";
export declare type LiteralNum = 2;
export declare class TestObj<T> {
    thing: string;
    generic: T;
    otherThing: number;
    /** nested description */
    nested: {
        /** nestedprop description */
        nestedProp: string;
        nestedObj: {
            num: number;
        };
    };
}
export declare class BurnRoutes extends Controller {
    /**
     * a description
     * @param {Burn} burn
     * @param {ApiRequest} req
     * @param {StringAlias} testHeader override description
     * @maxLength testHeader 5
     */
    submit(burn: Burn, req: ApiRequest, testHeader: StringAlias, testQuery: StringAlias): TestResponse<Burn[]>;
    /**
     *
     * @param thing test
     */
    test(thing: string, input: TestObj<string>): void;
}
