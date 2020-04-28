import {ApiContext} from "./context";
import * as qs from "querystring";
import fn = jest.fn;

describe("parsing tests", () => {
    test("should parse application/json", () => {
        const context = new ApiContext({
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: "/test",
            pathParams: {},
            rawBody: `{"cool": true, "stuff": "blue"}`
        });

        expect(context.request.body).toStrictEqual({cool: true, stuff: "blue"});
    });

    test("should parse application/x-www-form-urlencoded", () => {
        const context = new ApiContext({
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/test",
            pathParams: {},
            rawBody: `cool=true&stuff=blue`
        });

        expect(context.request.body).toEqual({cool: "true", stuff: "blue"});
    });

    test("should parse using custom serializer application/blah", () => {
        const parser = fn(JSON.parse);
        ApiContext.registerParser("application/blah", parser);
        const context = new ApiContext({
            headers: {
                "Content-Type": "application/blah"
            },
            method: "POST",
            url: "/test",
            pathParams: {},
            rawBody: `{"cool": true, "stuff": "blue"}`
        });

        expect(context.request.body).toStrictEqual({cool: true, stuff: "blue"});
        expect(parser).toBeCalledWith(`{"cool": true, "stuff": "blue"}`);
    });
});

describe("serializing tests", () => {
    test("should serialize application/json", () => {
        const context = new ApiContext({
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: "/test",
            pathParams: {},
            rawBody: `{"cool": true, "stuff": "blue"}`
        });
        context.response.body = context.request.body;
        context.response.headers["content-type"] = "application/json";
        expect(context.serializeResponse()).toBe(`{"cool":true,"stuff":"blue"}`);
    });

    test("should serialize application/x-www-form-urlencoded", () => {
        const context = new ApiContext({
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/test",
            pathParams: {},
            rawBody: `cool=true&stuff=blue`
        });
        context.response.body = context.request.body;
        context.response.headers["content-type"] = "application/x-www-form-urlencoded";
        expect(context.serializeResponse()).toBe(`cool=true&stuff=blue`);
    });

    test("should serialize application/blah with custom serializer", () => {
        const serializer = fn(qs.stringify);
        ApiContext.registerSerializer("application/blah", serializer);
        const context = new ApiContext({
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: "/test",
            pathParams: {},
            rawBody: `{"cool": true, "stuff": "blue"}`
        });
        context.response.body = context.request.body;
        context.response.headers["content-type"] = "application/blah";
        expect(context.serializeResponse()).toBe(`cool=true&stuff=blue`);
    });
});
