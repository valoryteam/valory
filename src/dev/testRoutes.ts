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
    Path, Delete, Get, Hidden, Deprecated
} from "../server/decorators";
import {Controller} from "../server/controller";
import {ApiMiddleware} from "../lib/common/headers";
import {Endpoint, RequestValidator} from "../main";
const spec = require('./generated/openapi.json');
const docSite = `
<!DOCTYPE html>
<meta charset="UTF-8">
<html>
  <head>
    <title>nRF Connect for Cloud Device API Documentation</title>
    <link rel="shortcut icon" href="https://nordicsemi.com/images/Nordic-favicon.png">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js"></script>
    <style>
      body{margin:0;padding:0}
      .powered-by-badge{display:none}
      .api-info-header+p{display:none!important}
      header{text-align:right;padding-right:20px}
    </style>
  </head>
  <body>
    <redoc 
      hide-loading 
      expand-responses=all
      hide-single-request-sample-tab
      expand-single-schema-field
      json-sample-expand-level=all
      path-in-middle-panel
      required-props-first
      sort-props-alphabetically
    ></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
    <script>
      $(document).ready(function(){$(".api-info-header + p").hide(),$(document).on("click",function(o){window.history&&window.history.pushState?window.history.pushState("","",window.location.pathname):window.location.href=window.location.href.replace(/#.*$/,"#")});
      const theme = {
        logo: {
          gutter: '10px'
        },
        sidebar: { 
          textColor: 'white',
          activeTextColor: '#00adef',
          backgroundColor: '#023d55'
        },
        rightPanel: {
          backgroundColor: '#023d55'
        }
      };
      Redoc.init(${JSON.stringify(spec)},{ theme })});</script>
  </body>
</html>`;

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

export const literalMiddleware1: ApiMiddleware = {
    name: "LiteralMiddleware",
    handler(ctx) {
        ctx.attachments.getAttachment(Endpoint.RequestLoggerKey).info("Middleware 1");
    }
};

export const literalMiddleware2: ApiMiddleware = {
    name: "LiteralMiddleware",
    handler(ctx) {
        ctx.attachments.getAttachment(Endpoint.RequestLoggerKey).info("Middleware 2");
    }
};

/**
 * A omitted type
 * @example {"number": 2}
 */
export type OmitTestInput = Omit<TestInput, "string">;

/**
 * @pattern ^[a-zA-Z0-9-:]{4,}$
 */
export type StringAlias = Nominal<string>;

/**
 * @isInt test
 */
export type NumberAlias = number;

export type Complex = Omit<TestInput & { [key: string]: any }, "string">;

export interface Cool<T> {
    thing: T;
}

export enum Direction {
    ASC = "asc",
    DESC = "desc"
}

export type Nominal<Type> = Type & {
    readonly symbol: symbol;
};

type OctetStream = "application/octet-stream";

@Route()
export class TestController extends Controller {
    @AppendMiddleware(literalMiddleware1)
    @Post()
    public test(
        @Header("test-type") test?: Direction.ASC | Direction.DESC,
        @Body() body?: StringAlias,
    ): PaginatedResult<TestInput> {
        return {
            cool: true,
            yes: "blue"
        } as any;
    }

    @Get()
    @SuccessResponse<{
        "content-type": "text/html",
    }>(200)
    public getDocumentation() {
        this.setHeader('content-type', 'text/html');
        return docSite;
    }

    @Get('openapi.json')
    public getSpec(): any {
        return spec;
    }
}

@Route("test")
export class Test2Controller extends Controller {

    /**
     *
     * @format id date-time
     */
    @PrependMiddleware(literalMiddleware1, literalMiddleware2)
    @Get("{id}")
    public pathParamTest(@Path() id: number) {
        return id;
    }

    @Delete("{identifier}")
    public pathParamTest2(@Path() identifier: string) {
        return identifier;
    }
}
