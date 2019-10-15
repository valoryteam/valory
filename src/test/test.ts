import {expect} from "chai";
import {platform} from "os";
import * as path from "path";
import * as fs from "fs";
import {Options, OptionsWithUrl} from "request-promise";
import {ChildProcess, exec, execSync} from "child_process";
import {suite, timeout, test} from "mocha-typescript";
import {ValoryConfig} from "../lib/config";
import {after, before, describe} from "mocha";
import requestPromise = require("request-promise");
import {randomBytes} from "crypto";

const valoryPath = path.join(__dirname, "../lib/cli.js");
const valoryConfig = path.join(__dirname, "../../valory.json");
const tsCompiler = path.join(__dirname, "../../node_modules/.bin/tsc");
const root = path.join(__dirname, "../..");

const configOverride: ValoryConfig = {
    entrypoint: "dist/test/testApi.js",
    sourceEntrypoint: "src/test/testApi.ts",
    singleError: false,
};

// let api: any = null;
const ValoryTest = {
    currentConfig: null as Buffer,
    serverProc: null as ChildProcess,
};

class RequestTestBase {
    protected static response: any;
    protected static request: Partial<Options>;

    public static async before(request: Partial<OptionsWithUrl>) {
        this.request = request;
        request.resolveWithFullResponse = true;
        request.url = `http://localhost:8080${request.url}`;
        this.response = await requestPromise(this.request as Options);
        if (process.env["LOGLEVEL"] === "debug") {
            console.log(JSON.stringify({body: this.response.body, headers: this.response.headers}));
        }
        expect(this.response).property("statusCode").within(200, 299);
    }
}

describe("ValoryTest", () => {
    before(function() {
        this.timeout(200000);
        if (fs.existsSync(valoryConfig)) {
            ValoryTest.currentConfig = fs.readFileSync(valoryConfig);
        }
        fs.writeFileSync(valoryConfig, JSON.stringify(configOverride));

        process.env.NODE_ENV = "test";
        const cmdOut = execSync(`${process.execPath} ${valoryPath} compile`, {
            cwd: root,
            stdio: (process.env["LOGLEVEL"] === "debug") ? "inherit" : "ignore",
        });
        const tsOut = execSync(`${process.execPath} ${tsCompiler}`, {
            cwd: root,
            stdio: "ignore",
        });
        return new Promise((resolve, reject) => {
            ValoryTest.serverProc = exec(`${process.execPath} ${valoryPath} test`, {
                cwd: root,
            });
            ValoryTest.serverProc.stdout.on("data", (data: string) => {
                if (data.includes("Valory startup complete")) {
                    setTimeout(resolve, 50);
                }
                // if (data.includes(`"level":50`)) {
                //     console.log(data);
                // }
            });
            ValoryTest.serverProc.stderr.on("data", (data: string) => {
                reject(data);
            });
        });
    });

    after(() => {
        if (fs.existsSync(valoryConfig)) {
            fs.writeFileSync(valoryConfig, ValoryTest.currentConfig);
        }
        let pid = ValoryTest.serverProc.pid;
        if (platform() !== "darwin") { pid++; }
        process.kill(pid, "SIGTERM");
    });

    @suite
    class SimpleGetTest extends RequestTestBase {
        private static authBytes = randomBytes(10).toString("base64");
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/test",
                headers: {
                    Authorization: this.authBytes,
                },
            });
            this.parsed = JSON.parse(this.response.body);
        }

        @test
        public "Should not have property code"() {
            expect(SimpleGetTest.parsed).to.not.have.property("code");
        }

        @test
        public "Should have message 'yay'"() {
            expect(SimpleGetTest.parsed).to.have.property("message").equal("yay");
        }

        @test
        public "Should have proper auth header"() {
            expect(SimpleGetTest.parsed).to.have.property("authorization").equal(SimpleGetTest.authBytes);
        }

        @test
        public "Should have request-id header"() {
            expect(SimpleGetTest.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class SimpleCORSTest extends RequestTestBase {
        private static authBytes = randomBytes(10).toString("base64");

        public static async before() {
            await super.before({
                method: "OPTIONS",
                url: `/${randomBytes(10).toString("base64")}`,
                headers: {
                    Authorization: this.authBytes,
                },
            });
        }

        @test
        public "Should include CORS headers"() {
            expect(SimpleCORSTest.response.headers).to.have.property("Access-Control-Allow-Origin").eq("*");
        }
    }

    @suite
    class SimpleGetTestFail extends RequestTestBase {
        private static parsed: any;
        private static headerError = "ValidationError[required]: request.headers.authorization is a required property";

        public static async before() {
            await super.before({
                method: "GET",
                url: "/test",
            });
            this.parsed = JSON.parse(this.response.body);
        }

        @test
        public "Should have property code 1001"() {
            expect(SimpleGetTestFail.parsed).to.have.property("code").equal(1001);
        }

	    @test
	    public "Should have content-type application/json"() {
		    expect(SimpleGetTestFail.response.headers).to.have.property("content-type").equal("application/json");
	    }

        @test
        public "Should have error message for auth header"() {
            expect(SimpleGetTestFail.parsed).to.have.property("message").is.contains(SimpleGetTestFail.headerError);
        }

        @test
        public "Should have request-id header"() {
            expect(SimpleGetTestFail.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class SimplePostTest extends RequestTestBase {
        private static parsed: any;
        private static json = {
            name: "steven",
            isCool: true,
            simpleEnum: "thing",
        };

        public static async before() {
            await super.before({
                method: "POST",
                url: "/test/submit",
                json: SimplePostTest.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(SimplePostTest.parsed).to.not.have.property("code");
        }

        @test
        public "Should have property name equal to input"() {
            expect(SimplePostTest.parsed).to.have.property("name").equal(SimplePostTest.json.name);
        }

        @test
        public "Should have property isCool equal to input"() {
            expect(SimplePostTest.parsed).to.have.property("isCool").equal(true);
        }

        @test
        public "Should have request-id header"() {
            expect(SimplePostTest.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class DisallowReadonly extends RequestTestBase {
        private static parsed: any;
        private static json = {
            name: "steven",
            isCool: true,
            simpleEnum: "thing",
            id: "some id",
        };

        public static async before() {
            await super.before({
                method: "POST",
                url: "/test/submit",
                json: DisallowReadonly.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should have property code"() {
            expect(DisallowReadonly.parsed).to.have.property("code");
        }

        @test
        public "Should have invalid property error"() {
            expect(DisallowReadonly.parsed).to.have.property("message")
                .contains("ValidationError[not]: request.body.id should NOT be valid");
        }
    }

    @suite
    class GenericPostTest extends RequestTestBase {
        private static parsed: any;
        private static json = {
            common: "com",
            generic: {
                name: "steven",
                isCool: true,
                simpleEnum: "thing",
            },
        };

        private static jsonResponse = {
            common: "com",
            generic: {
                id: "stuff",
                name: "steven",
                isCool: true,
                simpleEnum: "thing",
            },
        };

        public static async before() {
            await super.before({
                method: "POST",
                url: "/test/submit/generic",
                json: GenericPostTest.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(GenericPostTest.parsed).to.not.have.property("code");
        }

        @test
        public "Should match input"() {
            expect(GenericPostTest.parsed).to.eql(GenericPostTest.jsonResponse);
        }

        @test
        public "Should have request-id header"() {
            expect(GenericPostTest.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class GenericLiteralPostTest extends RequestTestBase {
        private static parsed: any;
        private static json = {
            literal1: {
                common: "stuff",
                generic: {
                    potato: true,
                },
            },
            literal2: {
                common: "other",
                generic: {
                    other: "string",
                },
            },
        };

        public static async before() {
            await super.before({
                method: "POST",
                url: "/test/submit/generic/literal",
                json: GenericLiteralPostTest.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(GenericLiteralPostTest.parsed).to.not.have.property("code");
        }

        @test
        public "Should match input"() {
            expect(GenericLiteralPostTest.parsed).to.eql(GenericLiteralPostTest.json);
        }

        @test
        public "Should have request-id header"() {
            expect(GenericLiteralPostTest.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class IndexedAccessPostTest extends RequestTestBase {
        private static parsed: any;
        private static json = {
            ref: "thing",
        };

        public static async before() {
            await super.before({
                method: "POST",
                url: "/test/submit/indexed",
                json: IndexedAccessPostTest.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(IndexedAccessPostTest.parsed).to.not.have.property("code");
        }

        @test
        public "Should match input"() {
            expect(IndexedAccessPostTest.parsed).to.eql(IndexedAccessPostTest.json);
        }

        @test
        public "Should have request-id header"() {
            expect(IndexedAccessPostTest.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class ContentTypeTest extends RequestTestBase {
        private static parsed: any;
        private static json = {
            name: "steven",
            isCool: true,
            simpleEnum: "thing",
        };

        public static async before() {
            await super.before({
                method: "POST",
                url: "/test/submit",
                headers: {
                    "content-type": "application/json;charset=utf-8",
                },
                json: ContentTypeTest.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(ContentTypeTest.parsed).to.not.have.property("code");
        }

        @test
        public "Should have property name equal to input"() {
            expect(ContentTypeTest.parsed).to.have.property("name").equal(ContentTypeTest.json.name);
        }

        @test
        public "Should have property isCool equal to input"() {
            expect(ContentTypeTest.parsed).to.have.property("isCool").equal(true);
        }

        @test
        public "Should have request-id header"() {
            expect(ContentTypeTest.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class RequestIdTest extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/test/id",
                json: true,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(RequestIdTest.parsed).to.not.have.property("code");
        }

        @test
        public "Should have request-id header"() {
            expect(RequestIdTest.response.headers).to.have.property("request-id").a("string");
        }

        @test
        public "Should match requestId in header and body"() {
            expect(RequestIdTest.parsed).to.have.property("requestId")
                .equal(RequestIdTest.response.headers["request-id"]);
        }

        @test
        public "Should have request id in middleware and request"() {
            expect(RequestIdTest.parsed).to.have.property("loggerId").includes(RequestIdTest.parsed.requestId);
            expect(RequestIdTest.parsed).to.have.property("middlewareId").includes(RequestIdTest.parsed.requestId);
        }
    }

    @suite
    class SimplePostPropTest extends RequestTestBase {
        private static parsed: any;
        private static json = {
            item: {
                name: "steven",
                isCool: true,
            },
        };

        public static async before() {
            await super.before({
                method: "POST",
                url: "/test/submit/property",
                json: SimplePostPropTest.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(SimplePostPropTest.parsed).to.not.have.property("code");
        }

        @test
        public "Should have property name equal to input"() {
            expect(SimplePostPropTest.parsed).to.have.property("name").equal(SimplePostPropTest.json.item.name);
        }

        @test
        public "Should have property isCool equal to input"() {
            expect(SimplePostPropTest.parsed).to.have.property("isCool").equal(SimplePostPropTest.json.item.isCool);
        }

        @test
        public "Should have request-id header"() {
            expect(SimplePostPropTest.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class SimplePostTestFail extends RequestTestBase {
        private static parsed: any;
        private static json = {
            isCool: "yay",
            simpleEnum: "blah",
        };

        public static async before() {
            await super.before({
                method: "POST",
                url: "/test/submit",
                json: SimplePostTestFail.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should have property code 1001"() {
            expect(SimplePostTestFail.parsed).to.have.property("code").equal(1001);
        }

        @test
        public "Should have error for isCool"() {
            expect(SimplePostTestFail.parsed).to.have.property("message")
                .contains("ValidationError[type]: request.body.isCool should be boolean");
        }

        @test
        public "Should have content-type application/json"() {
            expect(SimplePostTestFail.response.headers).to.have.property("content-type").equal("application/json");
        }

        @test
        public "Should have error for missing name"() {
            expect(SimplePostTestFail.parsed).to.have.property("message")
                .contains("ValidationError[required]: request.body.name is a required property");
        }

        @test
        public "Should have error for bad enum"() {
            expect(SimplePostTestFail.parsed).to.have.property("message")
                .contains("ValidationError[enum]: request.body.simpleEnum should be equal to one of the allowed values: [thing,other]");
        }

        @test
        public "Should have request-id header"() {
            expect(SimplePostTestFail.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class ErrorApiException extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/error/apiexception",
                json: true,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should have property code 1331"() {
            expect(ErrorApiException.parsed).to.have.property("code").equal(1331);
        }

        @test
        public "Should have message 'Test ApiError'"() {
            expect(ErrorApiException.parsed).to.have.property("message").equal("Test ApiError");
        }

        @test
        public "Should have request-id header"() {
            expect(ErrorApiException.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class ErrorObject extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/error/object",
                json: true,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should have property code 1331"() {
            expect(ErrorObject.parsed).to.have.property("code").equal(1331);
        }

        @test
        public "Should have message 'Test ApiError'"() {
            expect(ErrorObject.parsed).to.have.property("message").equal("Test ApiError");
        }

        @test
        public "Should have request-id header"() {
            expect(ErrorObject.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class ErrorException extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/error/exception",
                json: true,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should have property code 1003"() {
            expect(ErrorException.parsed).to.have.property("code").equal(1003);
        }

        @test
        public "Should have message 'Test ApiError'"() {
            expect(ErrorException.parsed).to.have.property("message").equal("An internal error occurred");
        }

        @test
        public "Should have request-id header"() {
            expect(ErrorException.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class PreClassMiddlewareSuccess extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/middleware/pre/class/success",
                json: true,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(PreClassMiddlewareSuccess.parsed).to.not.have.property("code");
        }

        @test
        public "Should have attachments that match"() {
            // expect(PreClassMiddlewareSuccess.parsed).to.have.property("key");
            // expect(PreClassMiddlewareSuccess.parsed.key).to.have.property("id");
            // const key = PreClassMiddlewareSuccess.parsed.key;
            expect(PreClassMiddlewareSuccess.parsed).to.have.property("data");
            const data = PreClassMiddlewareSuccess.parsed.data;
            expect(PreClassMiddlewareSuccess.parsed.data).to.have.property("data");
        }

        @test
        public "Should have request-id header"() {
            expect(PreClassMiddlewareSuccess.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class PreObjectMiddlewareSuccess extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/middleware/pre/object/success",
                json: true,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(PreObjectMiddlewareSuccess.parsed).to.not.have.property("code");
        }

        @test
        public "Should have attachments that match"() {
            // expect(PreObjectMiddlewareSuccess.parsed).to.have.property("key");
            // expect(PreObjectMiddlewareSuccess.parsed.key).to.have.property("id");
            // const key = PreObjectMiddlewareSuccess.parsed.key;
            expect(PreObjectMiddlewareSuccess.parsed).to.have.property("data");
            const data = PreObjectMiddlewareSuccess.parsed.data;
            expect(PreObjectMiddlewareSuccess.parsed.data).to.have.property("data");
        }

        @test
        public "Should have request-id header"() {
            expect(PreObjectMiddlewareSuccess.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class PreClassMiddlewareFailure extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/middleware/pre/class/failure",
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(PreClassMiddlewareFailure.parsed).to.not.have.property("code");
        }

        @test
        public "Should have body message"() {
            expect(PreClassMiddlewareFailure.parsed).equal("An error occurred");
        }

        @test
        public "Should have request-id header"() {
            expect(PreClassMiddlewareFailure.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class PreObjectMiddlewareFailure extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/middleware/pre/object/failure",
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(PreObjectMiddlewareFailure.parsed).to.not.have.property("code");
        }

        @test
        public "Should have body message"() {
            expect(PreObjectMiddlewareFailure.parsed).equal("An error occurred");
        }

        @test
        public "Should have request-id header"() {
            expect(PreObjectMiddlewareFailure.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class PostClassMiddlewareSuccess extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/middleware/post/class/success",
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(PostClassMiddlewareSuccess.parsed).to.not.have.property("code");
        }

        @test
        public "Should have body message"() {
            expect(PostClassMiddlewareSuccess.parsed).equal("no error");
        }

        @test
        public "Should have request-id header"() {
            expect(PostClassMiddlewareSuccess.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class PostObjectMiddlewareSuccess extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/middleware/post/object/success",
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(PostObjectMiddlewareSuccess.parsed).to.not.have.property("code");
        }

        @test
        public "Should have body message"() {
            expect(PostObjectMiddlewareSuccess.parsed).equal("no error");
        }

        @test
        public "Should have request-id header"() {
            expect(PostObjectMiddlewareSuccess.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class PostClassMiddlewareFailure extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/middleware/post/class/failure",
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(PostClassMiddlewareFailure.parsed).to.not.have.property("code");
        }

        @test
        public "Should have body message"() {
            expect(PostClassMiddlewareFailure.parsed).equal("An error occurred");
        }

        @test
        public "Should have request-id header"() {
            expect(PostClassMiddlewareFailure.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class PostObjectMiddlewareFailure extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/middleware/post/object/failure",
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(PostObjectMiddlewareFailure.parsed).to.not.have.property("code");
        }

        @test
        public "Should have body message"() {
            expect(PostObjectMiddlewareFailure.parsed).equal("An error occurred");
        }

        @test
        public "Should have request-id header"() {
            expect(PostObjectMiddlewareFailure.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class OverrideMiddlewarePrePost extends RequestTestBase {
        private static parsed: any;

        public static async before() {
            await super.before({
                method: "GET",
                url: "/middleware/override/pre-post",
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(OverrideMiddlewarePrePost.parsed).to.not.have.property("code");
        }

        @test
        public "Should have body message"() {
            expect(OverrideMiddlewarePrePost.parsed).equal("post");
        }

        @test
        public "Should have request-id header"() {
            expect(OverrideMiddlewarePrePost.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class TypesDiscriminatorBasic extends RequestTestBase {
        private static parsed: any;
        private static json = {
            name: "Child1",
            hat: {
                color: "red",
                size: 5,
            },
        };

        public static async before() {
            await super.before({
                method: "POST",
                url: "/types/discriminator/basic",
                json: TypesDiscriminatorBasic.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should not have property code"() {
            expect(TypesDiscriminatorBasic.parsed).to.not.have.property("code");
        }

        @test
        public "Should have body match"() {
            expect(TypesDiscriminatorBasic.parsed).deep.equal(TypesDiscriminatorBasic.json);
        }

        @test
        public "Should have request-id header"() {
            expect(TypesDiscriminatorBasic.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class TypesDiscriminatorNoType extends RequestTestBase {
        private static parsed: any;
        private static json = {};
        private expectedErrors = ["ValidationError[required]: request.body.name is a required property",
            "ValidationError[discriminator]: request.body should be an implementation of Parent [Child1,Child2]"];

        public static async before() {
            await super.before({
                method: "POST",
                url: "/types/discriminator/basic",
                json: TypesDiscriminatorNoType.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should have property code"() {
            expect(TypesDiscriminatorNoType.parsed).to.have.property("code").equal(1001);
        }

        @test
        public "Should have no extra errors"() {
            expect(TypesDiscriminatorNoType.parsed).property("message").deep.equal(this.expectedErrors);
        }

        @test
        public "Should have request-id header"() {
            expect(TypesDiscriminatorNoType.response.headers).to.have.property("request-id").a("string");
        }
    }

    @suite
    class TypesDiscriminatorBranchValidation extends RequestTestBase {
        private static parsed: any;
        private static json = {
            name: "Child1",
        };
        private expectedErrors = ["ValidationError[required]: request.body.hat is a required property",
            "ValidationError[discriminator]: request.body should be an implementation of Parent [Child1,Child2]"];

        public static async before() {
            await super.before({
                method: "POST",
                url: "/types/discriminator/basic",
                json: TypesDiscriminatorBranchValidation.json,
            });
            this.parsed = this.response.body;
        }

        @test
        public "Should have property code"() {
            expect(TypesDiscriminatorBranchValidation.parsed).to.have.property("code").equal(1001);
        }

        @test
        public "Should only have errors from selected branch"() {
            expect(TypesDiscriminatorBranchValidation.parsed).property("message")
                .deep.equal(this.expectedErrors);
        }

        @test
        public "Should have request-id header"() {
            expect(TypesDiscriminatorBranchValidation.response.headers).to.have.property("request-id").a("string");
        }
    }
});
