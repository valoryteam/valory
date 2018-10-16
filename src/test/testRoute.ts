import {
    ApiError,
    ApiMiddleware,
    ApiRequest,
    ApiResponse,
    Body,
    BodyProp,
    Controller, DisableSerialization,
    Get,
    Header,
    Middleware,
    Post, PostMiddleware,
    Request,
    Route, Valory,
} from "../main";
import {Logger} from "pino";
import {randomBytes} from "crypto";
import {cloneDeep} from "lodash";
const pinoSymbols = require("pino/lib/symbols");

class ClassMiddleware implements ApiMiddleware {
    public static ClassMiddlewareDataKey = ApiRequest.createKey<{ data: string }>();
    public name = "ClassMiddleware";

    public handler(req: ApiRequest, logger: Logger, done: (err?: ApiResponse) => void) {
        const attachment = {
            data: randomBytes(20).toString("base64"),
        };

        req.putAttachment(ClassMiddleware.ClassMiddlewareDataKey, attachment);
        done();
    }
}

const ObjectMiddlewareDataKey = ApiRequest.createKey<{ data: string }>();
const ObjectMiddleware: ApiMiddleware = {
    name: "ObjectMiddleware",
    handler: (req: ApiRequest, logger: Logger, done: (err?: ApiResponse) => void) => {
        const attachment = {
            data: randomBytes(20).toString("base64"),
        };

        req.putAttachment(ObjectMiddlewareDataKey, attachment);
        done();
    },
};

class ClassMiddlewareFail implements ApiMiddleware {
    public name = "ClassMiddlewareFail";

    constructor(private message: string = "An error occurred") {}

    public handler(req: ApiRequest, logger: Logger, done: (err?: ApiResponse) => void) {
        done({
            body: this.message,
            headers: {},
            statusCode: 210,
        });
    }
}

const ObjectMiddlewareFail: ApiMiddleware = {
    name: "ObjectMiddlewareFail",
    handler: (req: ApiRequest, logger: Logger, done: (err?: ApiResponse) => void) => {
        done({
            body: "An error occurred",
            headers: {},
            statusCode: 210,
        });
    },
};

const MiddlewareLoggerKey = ApiRequest.createKey<string>();
class MiddlewareLoggerAttach implements ApiMiddleware {
    public name = "MiddlewareLoggerAttach";
    public handler(req: ApiRequest, logger: Logger, done: (err?: ApiResponse) => void) {
        req.putAttachment(MiddlewareLoggerKey, (logger as any)[pinoSymbols.chindingsSym]);
        done();
    }
}

@Route("test")
export class TestRoute extends Controller {
    constructor() {
        super();
    }

    @Get()
    public test(@Header() authorization: string) {
        return {message: "yay", authorization};
    }

    @Post("submit")
    public submit(@Body() item: { name: string, isCool: boolean }) {
        return item;
    }

    @Post("submit/property")
    public submitProp(@BodyProp("item") item: { name: string, isCool: boolean }) {
        return item;
    }

    @Get("id")
    @DisableSerialization()
    @Middleware(new MiddlewareLoggerAttach())
    public testId(@Request() req: ApiRequest) {
        return {
            requestId: req.getAttachment(Valory.RequestIDKey),
            loggerId: (this.logger as any)[pinoSymbols.chindingsSym],
            middlewareId: req.getAttachment(MiddlewareLoggerKey),
        };
    }
}

@Route("error")
export class ErrorTestRoute extends Controller {
    @Get("apiexception")
    public errorApiException() {
        throw ApiError("TestError");
    }

    @Get("exception")
    public errorException() {
        throw Error("This is a mean error message");
    }

    @Get("object")
    public errorObject() {
        return this.buildError("TestError");
    }
}

@Route("middleware")
export class MiddlewareTestRoute extends Controller {
    @Middleware(new ClassMiddleware())
    @Get("pre/class/success")
    @DisableSerialization()
    public preClassSuccess(@Request() req: ApiRequest) {
        const res =  {
            attachments: cloneDeep((req as any).attachments),
            key: ClassMiddleware.ClassMiddlewareDataKey,
            data: cloneDeep(req.getAttachment(ClassMiddleware.ClassMiddlewareDataKey)),
        };

        return res;
    }

    @Middleware(ObjectMiddleware)
    @Get("pre/object/success")
    @DisableSerialization()
    public preObjectSuccess(@Request() req: ApiRequest) {
        return {
            attachments: cloneDeep(req as any).attachments,
            key: ObjectMiddlewareDataKey,
            data: cloneDeep(req.getAttachment(ObjectMiddlewareDataKey)),
        };
    }

    @Middleware(new ClassMiddlewareFail())
    @Get("pre/class/failure")
    public preClassFailure(@Request() req: ApiRequest) {
        return;
    }

    @Middleware(ObjectMiddlewareFail)
    @Get("pre/object/failure")
    public preObjectFailure(@Request() req: ApiRequest) {
        return;
    }

    @PostMiddleware(new ClassMiddleware())
    @Get("post/class/success")
    public postClassSuccess(@Request() req: ApiRequest) {
        return "no error";
    }

    @PostMiddleware(ObjectMiddleware)
    @Get("post/object/success")
    public postObjectSuccess(@Request() req: ApiRequest) {
        return "no error";
    }

    @PostMiddleware(new ClassMiddlewareFail())
    @Get("post/class/failure")
    public postClassFailure(@Request() req: ApiRequest) {
        return "no error";
    }

    @PostMiddleware(ObjectMiddlewareFail)
    @Get("post/object/failure")
    public postObjectFailure(@Request() req: ApiRequest) {
        return "no error";
    }

    @Middleware(new ClassMiddlewareFail("pre"))
    @PostMiddleware(new ClassMiddlewareFail("post"))
    @Get("override/pre-post")
    public overridePrePost() {
        return;
    }
}

interface Child1 {
    name: "Child1";
    hat: {
        color: string,
        size: number,
    };
}

interface Child2 {
    name: "Child2";
    nerdy: boolean;
}

type Parent = Child1 | Child2;

@Route("types") export class TypesTestController extends Controller {
    @DisableSerialization()
    @Post("discriminator/basic") public discriminatorBasic(@Body() input: Parent) {
        return input;
    }
}
