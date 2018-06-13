import {
	Valory, ErrorDef, ApiRequest, ApiMiddleware, ApiResponse,
} from "../main";
import {Info, Schema} from "swagger-schema-official";
import {FastifyAdaptor} from "valory-adaptor-fastify";
// Define basic info for the api
const info: Info = {
	title: "CNP POC API",
	version: "1",
};
const definitions: {[name: string]: Schema} = {
	status_code: {
		description: "Status code for the call. Successful call will return 1",
		type: "integer",
		// example: 1,
	},
	merchant_ref: {
		description: "Merchant reference code – used by Payeezy system will be reflected in your settlement records and" +
		" webhook notifications. \nIt is an \"optional\" field",
		type: "string",
		// example: "Astonishing-Sale",
	},
	transaction_type: {
		description: "Type of transaction that merchant would want to process",
		type: "string",
		// example: "purchase",
	},
	method: {
		description: "Inputted transaction method",
		type: "string",
	},
	amount: {
		description: "amount",
		type: "string",
		// example: "12.99",
	},
	partial_redemption: {
		description: "Default set to false. When set to true, the transaction is enabled to complete using more than" +
		" one credit card. A partially-authorized transaction will generate a Split Tender ID. Subsequent transactions " +
		"to complete the authorization should include the Split Tender ID so that all the transactions comprising that " +
		"authorization can be linked using the Split-Tender tab.",
		type: "string",
		// example: "false",
	},
	currency_code: {
		description: "Currency Code",
		type: "string",
		// example: "USD",
	},
	credit_card: {
		description: "credit card object",
		type: "object",
		properties: {
			type: {
				description: "Type of CC",
				type: "string",
				// example: "visa",
			},
			cardholder_name: {
				description: "Name of the CC holder",
				type: "string",
				// example: "John Smith",
			},
			card_number: {
				description: "CC Number",
				type: "string",
				// example: "4788250000028291",
			},
			exp_date: {
				description: "Expiration date",
				type: "string",
				// example: "1020",
			},
			cvv: {
				description: "CVV",
				type: "string",
				// example: "123",
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
				required: ["credit_card"],
			},
		],
	},
	OtherCard: {
		description: "Other Card Payment",
		allOf: [
			{
				$ref: "#/definitions/Payment",
			},
			{
				type: "object",
				properties: {
					other_card: {
						$ref: "#/definitions/credit_card",
					},
				},
				required: ["other_card"],
			},
		],
	},
	SomethingCard: {
		description: "SomethingCard Payment",
		allOf: [
			{
				$ref: "#/definitions/Payment",
			},
			{
				type: "object",
				properties: {
					other_card: {
						$ref: "#/definitions/credit_card",
					},
				},
				required: ["other_card"],
			},
		],
	},
	ThingCard: {
		description: "ThingCard Payment",
		allOf: [
			{
				$ref: "#/definitions/Payment",
			},
			{
				type: "object",
				properties: {
					other_card: {
						$ref: "#/definitions/credit_card",
					},
				},
				required: ["other_card"],
			},
		],
	},
	Payment: {
		discriminator: "method",
		description: "Payload for purchase",
		type: "object",
		properties: {
			merchant_ref: {
				$ref: "#/definitions/merchant_ref",
			},
			transaction_type: {
				$ref: "#/definitions/transaction_type",
			},
			method: {
				description: "Type of a payment method",
				type: "string",
			},
			amount: {
				$ref: "#/definitions/amount",
			},
		},
		required: ["method", "amount"],
	},
};
const errors: { [name: string]: ErrorDef } = {
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
	server: new FastifyAdaptor() as any,
	parameters: {
		fancy_header: {
			name: "fancy_header",
			in: "header",
			required: true,
			type: "string",
		},
	},
});
const TestKey = ApiRequest.createKey<string>();
const TestMiddleware: ApiMiddleware = {
	tag: {
		name: "GTFO",
		description: "Access denied on this resource",
	},
	name: "TestMiddleware",
	handler: (req, logger, done) => {
		req.getAttachment(Valory.ResponseKey);
		req.putAttachment(TestKey, "string");
		// done(api.buildError("AccessDenied"));
		done();
	},
};
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
// api.addGlobalPostMiddleware(TestMiddleware);
// Register an enpoint with the full expressive power of swagger 2.0
api.post("/v1/transactions", {
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
				$ref: "#/definitions/Payment",
			},
			required: true,
		},
	],
	responses: {
		200: {
			description: "The response",
			schema: {
				type: "object",
				properties: {
					status_code: {
						$ref: "#/definitions/status_code",
					},
					response_data: {
						type: "object",
						description: "test",
					},
				},
			},
		},
	},
}, (req) => {
	// The handler can be sync or async
	// Build a successful response with the helper
	return api.buildSuccess({});
}, [TestMiddleware]);

// Build and export the app, passing any adaptor specific config data
module.exports = api.start({port: process.env.PORT || 8080});
