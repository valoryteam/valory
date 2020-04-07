import * as util from "./util";

describe("isReferenceObject", () => {
    test("should return true for ref object", () => {
        expect(util.isReferenceObject({$ref: "some ref"})).toBe(true);
    });

    test("should fail for non ref object", () => {
        expect(util.isReferenceObject({})).toBe(false);
    });
});

describe("sha1String", () => {
    test("should sha1 to a string", () => {
        expect(util.sha1String("a test string")).toBe("2da75da5c85478df42df0f917700241ed282f599");
    });
});

describe("arrayPush", () => {
    test("should merge arrays", () => {
        const a = [0, 1, 2, 3];
        const b = [4, 5, 6, 7];
        const c = [0, 1, 2, 3, 4, 5, 6, 7];
        expect(util.arrayPush(a, b))
            .toStrictEqual(c);
    });
});

describe("lowercaseKeys", () => {
    test("should map object keys to lowercase", () => {
        const a = {
            testA: "1",
            Btest: 2,
            testc: "3"
        };
        const b = {
            testa: "1",
            btest: 2,
            testc: "3"
        };
        expect(util.lowercaseKeys(a)).toStrictEqual(b);
    });
});
