import {ApiMiddleware, ApiRequest, DefaultAdaptor, Swagger, Valory} from "../main";
import "./testRoute";
const info: Swagger.Info = {
	title: "Test api",
	version: "1",
};

const definitions: {[name: string]: Swagger.Schema} = {
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

const api = Valory.createInstance({
	info,
	server: new DefaultAdaptor(),
	definitions,
});

const TestMiddlewareKey = ApiRequest.createKey<string>();
const TestMiddleware: ApiMiddleware = {
	name: "TestMiddleware",
	handler: (req, logger, done) => {

		req.putAttachment(TestMiddlewareKey, "teststring");
		done(null);
	},
};

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
	return {
		body: req.headers,
		statusCode: 200,
		headers: {"Content-Type": "application/json"},
	};
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
	return api.buildSuccess(req.headers);
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
	return api.buildSuccess({TestMiddleware: {test: req.getAttachment(TestMiddlewareKey)} });
}, [TestMiddleware]);

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

	return api.buildSuccess(req.body);
});

api.start({port: 8080});

process.once("SIGTERM", () => {
	console.log("received exit");
	api.shutdown();
	process.exit();
});
