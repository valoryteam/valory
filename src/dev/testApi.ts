import {Info} from "swagger-schema-official";
import {HttpMethod, Valory, ValoryMetadata} from "../server/valory";

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
							"supersick",
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

const api = new Valory(info, {}, ["application/json"], ["application/json"], definitions, []);

api.endpoint("/burn", HttpMethod.GET, {
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
});

module.exports = api.start({port: 8080});
