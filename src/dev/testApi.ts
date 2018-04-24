import {Info} from "swagger-schema-official";
import {ApiMiddleware, ApiRequest, ApiResponse, ErrorDef, Valory} from "../main";
import {FastifyAdaptor} from "valory-adaptor-fastify";

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

const defObj = {
	status_code: {
		description: "Status code for the call. Successful call will return 1",
		type: "integer",
		example: 1,
	},
	merchant_ref: {
		description: "Merchant reference code – used by Payeezy system will be reflected in your settlement" +
		" records and webhook notifications. \n" +
		"It is an \"optional\" field",
		type: "string",
		example: "Astonishing-Sale",
	},
	transaction_type: {
		description: "Type of transaction that merchant would want to process",
		type: "string",
		example: "purchase",
	},
	method: {
		description: "Inputted transaction method",
		type: "string",
	},
	amount: {
		description: "amount",
		type: "string",
		example: "12.99",
	},
	partial_redemption: {
		description: "Default set to false. When set to true, the transaction is enabled to complete using more than " +
		"one credit card. A partially-authorized transaction will generate a Split Tender ID. Subsequent transactions to " +
		"complete the authorization should include the Split Tender ID so that all the transactions comprising that" +
		" authorization can be linked using the Split-Tender tab.",
		type: "string",
		example: "false",
	},
	currency_code: {
		description: "Currency Code",
		type: "string",
		example: "USD",
	},
	credit_card: {
		description: "credit card object",
		type: "object",
		properties: {
			type: {
				description: "Type of CC",
				type: "string",
				example: "visa",
			},
			cardholder_name: {
				description: "Name of the CC holder",
				type: "string",
				example: "John Smith",
			},
			card_number: {
				description: "CC Number",
				type: "string",
				example: "4788250000028291",
			},
			exp_date: {
				description: "Expiration date",
				type: "string",
				example: "1020",
			},
			cvv: {
				description: "CVV",
				type: "string",
				example: "123",
			},
		},
	},
	CreditCard: {
		description: "Credit Card Payment",
		allOf: [
			{
				$ref: "#/definitions/Payment",
			},
			{
				type: "object",
				properties: {
					credit_card: {
						$ref: "#/definitions/credit_card",
					},
				},
			},
		],
	},
};

const errors: { [name: string]: ErrorDef } = {
	AccessDenied: {
		statusCode: 401,
		errorCode: 1004,
		defaultMessage: "Access to this resource is denied",
	},
};

const api = Valory.createInstance({
	info,
	definitions: defObj as any,
	server: new FastifyAdaptor() as any,
});

const TestKey = ApiRequest.createKey<string>();

const TestMiddleware: ApiMiddleware = {
	name: "TestMiddleware",
	handler: (req, logger, done) => {
		req.getAttachment(Valory.ResponseKey);
		req.putAttachment(TestKey, "string");
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

api.addGlobalPostMiddleware(TestMiddleware);

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
	},
	null, true, [TestMiddleware]);

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

export = api.start({port: 8080});
