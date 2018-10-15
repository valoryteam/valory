import {
	Valory, ErrorDef, ApiRequest, ApiMiddleware, ApiResponse, Swagger, Route, Get,
} from "../main";
import {DefaultAdaptor} from "../lib/defaultAdaptor";
// Define basic info for the api
const info: Swagger.Info = {
	title: "CNP POC API",
	version: "1",
};
const definitions: {[name: string]: Swagger.Schema} = {
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
		type: "object",
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
	W3IRD$_: {
		discriminator: "di$_",
		required: ["di$_"],
		properties: {
            di$_: {
            	type: "string",
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
	Payment: {
		discriminator: "method",
		description: "Payload for purchase",
		type: "object",
		properties: {
			merchant_ref: {
				$ref: "#/definitions/merchant_ref",
			},
			currency: {
				type: "string",
				enum: ["USD", "CAD", "EUR", "AED", "AFN", "ALL", "AMD", "ARS", "AUD", "AZN", "BAM", "BDT", "BGN", "BHD",
					"BIF", "BND", "BOB", "BRL", "BWP", "BYR", "BZD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CVE",
					"CZK", "DJF", "DKK", "DOP", "DZD", "EEK", "EGP", "ERN", "ETB", "GBP", "GEL", "GHS", "GNF", "GTQ",
					"HKD", "HNL", "HRK", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES",
					"KHR", "KMF", "KRW", "KWD", "KZT", "LBP", "LKR", "LTL", "LVL", "LYD", "MAD", "MDL", "MGA", "MKD",
					"MMK", "MOP", "MUR", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB",
					"PEN", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SDG", "SEK", "SGD",
					"SOS", "SYP", "THB", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "UYU", "UZS", "VEF",
					"VND", "XAF", "XOF", "YER", "ZAR", "ZMK"],
			},
			country_code: {
				description: "Sender's address country code (ISO 3166-1 alpha-2)",
				type: "string",
				example: "US",
				enum: ["AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AN", "AW", "AU", "AT",
					"AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV", "BR",
					"IO", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN", "CX", "CC",
					"CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC",
					"EG", "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM",
					"GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM",
					"VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE",
					"JO", "KZ", "KE", "KI", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU",
					"MO", "MK", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD",
					"MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG",
					"NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT",
					"PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST",
					"SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "GS", "ES", "LK", "SD", "SR",
					"SJ", "SZ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR",
					"TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI",
					"WF", "EH", "YE", "ZM", "ZW"],
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
		required: ["method", "amount", "currency"],
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
	server: new DefaultAdaptor() as any,
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
api.addGlobalPostMiddleware(TestMiddleware);
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
api.start({port: 8080});

process.on("SIGTERM", () => {
	console.log("received exit");
	api.shutdown();
	process.exit();
});
