import {AsyncSeries} from "./async-series";
import {cloneDeep} from "lodash";

type TestContext = { [key: string]: any };

const func1 = jest.fn((ctx: TestContext) => {
    ctx["key1"] = "value1";
    ctx = cloneDeep(ctx);
});
const func2 = jest.fn((ctx: TestContext) => {
    ctx["key2"] = "value2";
    ctx = cloneDeep(ctx);
});
const func3 = jest.fn((ctx: TestContext) => {
    ctx["key3"] = "value3";
    ctx = cloneDeep(ctx);
});
const funcError = jest.fn((ctx: TestContext) => {
    ctx = cloneDeep(ctx);
    // tslint:disable-next-line:no-string-throw
    throw "a nasty exception";
});
// tslint:disable-next-line:no-empty
const iterator = jest.fn((ctx: TestContext) => true);
// tslint:disable-next-line:no-empty
const errorCallback = jest.fn(ctx => {
});

const executor = new AsyncSeries(
    [{handler: funcError}, {handler: func1}, {handler: func2}, {handler: func3}],
    iterator,
    errorCallback);

const context = {cool: true};
const final = {"cool": true, "key1": "value1", "key2": "value2", "key3": "value3"};

test("should execute series", async () => {
    await executor.execute(context);
});

test("should execute every handler", () => {
    expect(func1).toHaveBeenCalledWith(final);
    expect(func2).toHaveBeenCalledWith(final);
    expect(func3).toHaveBeenCalledWith(final);
    expect(funcError).toHaveBeenCalledWith(final);
});

test("should call iterator for every handler", () => {
    expect(iterator).toHaveBeenCalledTimes(4);
});

test("should call error callback to handle exception", () => {
    expect(errorCallback).toHaveBeenCalledWith(final, "a nasty exception", 0);
});
