import "./decRoute";
import {ErrorDef, Swagger, Valory} from "../main";
import {DefaultAdaptor} from "../lib/defaultAdaptor";
// Define basic info for the api
const info: Swagger.Info = {
    title: "CNP POC API",
    version: "1",
};
const definitions: { [name: string]: Swagger.Schema } = {
    W3IRD$_: {
        discriminator: "di$_",
        required: ["di$_", "\uD83C\uDF46"],
        properties: {
            "di$_": {
                type: "string",
            },
            "\uD83C\uDF46": {
                type: "boolean",
            },
        },
    },
    W3IRD3R_: {
        type: "object",
        properties: {
            thing: {
                type: "string",
            },
        },
        allOf: [
            {$ref: "#/definitions/W3IRD$_"},
        ],
    },
};
const errors: { [name: string]: ErrorDef } = {
    TestError: {
        statusCode: 444,
        errorCode: 1331,
        defaultMessage: "test error",
    },
    AccessDenied: {
        statusCode: 401,
        errorCode: 1004,
        defaultMessage: "Access to this resource is denied",
    },
};

// Create the valory singleton
const api = Valory.createInstance({
    info,
    errors,
    definitions,
    server: new DefaultAdaptor(),
    parameters: {
        fancy_header: {
            name: "fancy_header",
            in: "header",
            required: true,
            type: "string",
        },
    },
    requestIDName: "callRef",
});

api.post("/v1/w3ut", {
    summary: "/v1/transactions ",
    description: "Use this method to submit payments credit and debit cards. Supported transaction type is purchase",
    tags: ["Credit Card Payments"],
    parameters: [
        {
            $ref: "#/parameters/fancy_header",
        },
        {
            name: "body",
            in: "body",
            schema: {
                $ref: "#/definitions/W3IRD$_",
            },
            required: true,
        },
    ],
    responses: {
        200: {
            description: "The response",
        },
    },
}, (req) => {
    // The handler can be sync or async
    // Build a successful response with the helper
    return api.buildSuccess({});
}, undefined, false);

// Build and export the app, passing any adaptor specific config data
api.start({port: process.env.PORT || 8080});
