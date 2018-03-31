import {Info} from "swagger-schema-official";
import {ApiMiddleware, ApiResponse, ErrorDef, Valory} from "../server/valory";
import {FastifyAdaptor} from "valory-adaptor-fastify";
import {ApiExchange} from "valory";

const info: Info = {
	title: "Test api",
	version: "1",
};

const definitions = {
	Animal: {
		discriminator: "dtype",
		required: [
			"dtype",
			"name",
		],
		properties: {
			dtype: {
				type: "string",
			},
			name: {
				type: "string",
				minLength: 4,
				maxLength: 20,
			},
		},
	},
	Cat: {
		allOf: [
			{
				$ref: "#/definitions/Animal",
			},
			{
				type: "object",
				required: [
					"huntingSkill",
				],
				properties: {
					huntingSkill: {
						type: "string",
						enum: [
							"clueless",
							"lazy",
							"adventurous",
							"aggressive",
						],
					},
				},
			},
		],
	},
	Monkey: {
		allOf: [
			{
				$ref: "#/definitions/Animal",
			},
			{
				type: "object",
				required: [
					"numberOfFleas",
				],
				properties: {
					numberOfFleas: {
						type: "number",
						minimum: 0,
					},
				},
			},
		],
	},
	Dog: {
		allOf: [
			{
				$ref: "#/definitions/Animal",
			},
			{
				type: "object",
				required: [
					"tailWagging",
				],
				properties: {
					tailWagging: {
						type: "boolean",
					},
				},
			},
		],
	},
	BurnSubmit: {
		type: "object",
		required: [
			"sickBurn",
			"burnType",
		],
		properties: {
			sickBurn: {
				type: "string",
			},
			burnType: {
				type: "object",
				required: [
					"type",
					"pet",
				],
				properties: {
					type: {
						type: "string",
						enum: [
							"sick",
						],
					},
					pet: {
						$ref: "#/definitions/Animal",
					},
				},
			},
			phoneNumber: {
				type: "string",
				pattern: "^\\+?[1-9]\\d{1,14}$",
			},
		},
	},
};

const errors: {[name: string]: ErrorDef} = {
	AccessDenied: {
		statusCode: 401,
		errorCode: 1004,
		defaultMessage: "Access to this resource is denied",
	},
};

const api = new Valory(info, errors, ["application/json"], ["application/json"], definitions, [],
	new FastifyAdaptor() as any);

const TestMiddleware: ApiMiddleware<string> = {
	name: "TestMiddleware",
	handler: (req, logger, done) => {
		done(api.buildError("AccessDenied"));
	},
};
//
// class TestMiddleware implements ApiMiddleware<Valory> {
// 	public static middlewareName = "TestMiddleware";
// 	public handler(req: ApiRequest, logger: P.Logger, done) {
// 		done(api.buildError("AccessDenied"));
// 	}
// }

api.setErrorFormatter((error, message): ApiResponse => {
	return {
		statusCode: error.statusCode,
		body: {
			status_code: error.errorCode,
			message: (message != null) ? message : error.defaultMessage,
		},
		headers: {"Content-Type": "application/json"},
	};
});

api.addGlobalMiddleware(TestMiddleware);

api.get("/burn", {
	description: "Awful, horrible burns",
	summary: "Get burned",
	responses: {
		200: {
			description: "Returns a thing",
		},
	},
	parameters: [
		{
			required: true,
			type: "string",
			in: "header",
			name: "authorization",
			description: "JWT required",
		},
	],
}, (req) => {
	return api.buildSuccess("yay");
});

api.get("/burn/{name}", {
	description: "Burn someone",
	summary: "Burn someone by name",
	parameters: [
		{
			name: "name",
			in: "path",
			required: true,
			type: "string",
			description: "Name of person to burn",
		},
	],
	responses: {
		200: {
			description: "Returns a thing",
		},
	},
}, (req, logger) => {
	return api.buildSuccess("yay");
});

api.post("/formtest", {
	description: "Awful, horrible burns",
	summary: "Submit a burn for evaluation",
	parameters: [
		{
			in: "formData",
			name: "potato",
			required: true,
			type: "string",
		},
	],
	responses: {
		200: {
			description: "Returns a thing",
		},
	},
}, (req, logger) => {
	// logger.info(req);

	return api.buildSuccess(req.body);
});

api.post("/burn", {
	description: "Awful, horrible burns",
	summary: "Submit a burn for evaluation",
	parameters: [
		{
			required: true,
			name: "body",
			schema: {
				type: "object",
				allOf: [
					{
						$ref: "#/definitions/BurnSubmit",
					},
					{
						type: "object",
						properties: {
							thing: {
								type: "string",
							},
						},
					},
				],
			},
			in: "body",
		},
		{
			in: "header",
			name: "potato",
			required: false,
			type: "string",
		},
		{
			required: true,
			type: "string",
			in: "header",
			name: "authorization",
			description: "JWT required",
		},
	],
	responses: {
		200: {
			description: "Returns a thing",
		},
	},
}, (req, logger) => {
	// logger.info(req);

	return {
		body: "yay",
		statusCode: 401,
		headers: {},
	};
});

module.exports = api.start({port: 8080});
