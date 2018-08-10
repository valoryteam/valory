import {convertTime} from "../lib/helpers";

function timeFmt(timeDelta: number): string {
	return timeDelta.toFixed(3) + " ms";
}
const timings = {
	load: "",
	create: "",
	endpoints: "",
	total: "",
};

const loadStart = process.hrtime();
import {ApiMiddleware, ApiRequest, ApiResponse, ErrorDef, Valory, Swagger} from "../main";
import {DefaultAdaptor} from "../lib/defaultAdaptor";
const loadDone = process.hrtime(loadStart);
// console.log(JSON.stringify(Object.keys(require.cache)));
const loadTime = convertTime(loadDone);
timings.load = timeFmt(loadTime);
const createStart = process.hrtime();
const info: Swagger.Info = {
	title: "Test api",
	version: "1",
};

const definitions: {[id: string]: Swagger.Schema} = {
	Order: {
		type: "object",
		properties: {
			id: {
				type: "integer",
				format: "int64",
			},
			petId: {
				type: "integer",
				format: "int64",
			},
			quantity: {
				type: "integer",
				format: "int32",
			},
			shipDate: {
				type: "string",
				format: "date-time",
			},
			status: {
				type: "string",
				description: "Order Status",
				enum: [
					"placed",
					"approved",
					"delivered",
				],
			},
			complete: {
				type: "boolean",
				default: false,
			},
		},
	},
	User: {
		type: "object",
		properties: {
			id: {
				type: "integer",
				format: "int64",
			},
			username: {
				type: "string",
			},
			firstName: {
				type: "string",
			},
			lastName: {
				type: "string",
			},
			email: {
				type: "string",
			},
			password: {
				type: "string",
			},
			phone: {
				type: "string",
			},
			userStatus: {
				type: "integer",
				format: "int32",
				description: "User Status",
			},
		},
	},
	Category: {
		type: "object",
		properties: {
			id: {
				type: "integer",
				format: "int64",
			},
			name: {
				type: "string",
			},
		},
	},
	Tag: {
		type: "object",
		properties: {
			id: {
				type: "integer",
				format: "int64",
			},
			name: {
				type: "string",
			},
		},
	},
	Pet: {
		type: "object",
		required: [
			"name",
			"photoUrls",
		],
		properties: {
			id: {
				type: "integer",
				format: "int64",
			},
			category: {
				$ref: "#/definitions/Category",
			},
			name: {
				type: "string",
				example: "doggie",
			},
			photoUrls: {
				type: "array",
				xml: {
					wrapped: true,
				},
				items: {
					type: "string",
				},
			},
			tags: {
				type: "array",
				xml: {
					wrapped: true,
				},
				items: {
					$ref: "#/definitions/Tag",
				},
			},
			status: {
				type: "string",
				description: "pet status in the store",
				enum: [
					"available",
					"pending",
					"sold",
				],
			},
		},
	},
	ApiResponse: {
		type: "object",
		properties: {
			code: {
				type: "integer",
				format: "int32",
			},
			type: {
				type: "string",
			},
			message: {
				type: "string",
			},
		},
	},
};

const errors: { [name: string]: ErrorDef } = {
	AccessDenied: {
		statusCode: 401,
		errorCode: 1004,
		defaultMessage: "Access to this resource is denied",
	},
	UnimplementedEndpoint: {
		statusCode: 200,
		errorCode: 1001,
		defaultMessage: "Endpoint not yet implemented",
	},
};

const tags: Swagger.Tag[] = [
	{
		name: "pet",
		description: "Everything about your Pets",
		externalDocs: {
			description: "Find out more",
			url: "http://swagger.io",
		},
	},
	{
		name: "store",
		description: "Access to Petstore orders",
	},
	{
		name: "user",
		description: "Operations about user",
		externalDocs: {
			description: "Find out more about our store",
			url: "http://swagger.io",
		},
	},
];

const api = Valory.createInstance({
	info,
	definitions,
	errors,
	tags,
	server: new DefaultAdaptor(),
});

const TestKey = ApiRequest.createKey<string>();

const TestMiddleware: ApiMiddleware = {
	tag: ["Super chill", {
		name: "Denier",
		description: "Denies access",
	}],
	name: "TestMiddleware",
	handler: (req, logger, done) => {
		const validationResult = req.getAttachment(Valory.ValidationResultKey);
		req.getAttachment(Valory.ResponseKey);
		req.putAttachment(TestKey, "string");
		done(api.buildError("AccessDenied"));
	},
};
const createEnd = process.hrtime(createStart);
const createTime = convertTime(createEnd);
timings.create = timeFmt(createTime);

api.addGlobalPostMiddleware(TestMiddleware);

const endpointsStart = process.hrtime();

api.post("/pet", {
		tags: [
			"pet",
		],
		summary: "Add a new pet to the store",
		description: "",
		operationId: "addPet",
		consumes: [
			"application/json",
			"application/xml",
		],
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				in: "body",
				name: "body",
				description: "Pet object that needs to be added to the store",
				required: true,
				schema: {
					$ref: "#/definitions/Pet",
				},
			},
		],
		responses: {
			405: {
				description: "Invalid input",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /pet");
	});

api.put("/pet", {
		tags: [
			"pet",
		],
		summary: "Update an existing pet",
		description: "",
		operationId: "updatePet",
		consumes: [
			"application/json",
			"application/xml",
		],
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				in: "body",
				name: "body",
				description: "Pet object that needs to be added to the store",
				required: true,
				schema: {
					$ref: "#/definitions/Pet",
				},
			},
		],
		responses: {
			400: {
				description: "Invalid ID supplied",
			},
			404: {
				description: "Pet not found",
			},
			405: {
				description: "Validation exception",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /pet");
	});

api.post("/user", {
		tags: [
			"user",
		],
		summary: "Create user",
		description: "This can only be done by the logged in user.",
		operationId: "createUser",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				in: "body",
				name: "body",
				description: "Created user object",
				required: true,
				schema: {
					$ref: "#/definitions/User",
				},
			},
		],
		responses: {
			default: {
				description: "successful operation",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /user");
	});

api.get("/pet/findByStatus", {
		tags: [
			"pet",
		],
		summary: "Finds Pets by status",
		description: "Multiple status values can be provided with comma separated strings",
		operationId: "findPetsByStatus",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "status",
				in: "query",
				description: "Status values that need to be considered for filter",
				required: true,
				type: "array",
				items: {
					type: "string",
					enum: [
						"available",
						"pending",
						"sold",
					],
					default: "available",
				},
				collectionFormat: "multi",
			},
		],
		responses: {
			200: {
				description: "successful operation",
				schema: {
					type: "array",
					items: {
						$ref: "#/definitions/Pet",
					},
				},
			},
			400: {
				description: "Invalid status value",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /pet/findByStatus");
	});

api.get("/pet/findByTags", {
		tags: [
			"pet",
		],
		summary: "Finds Pets by tags",
		description: "Muliple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.",
		operationId: "findPetsByTags",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "tags",
				in: "query",
				description: "Tags to filter by",
				required: true,
				type: "array",
				items: {
					type: "string",
				},
				collectionFormat: "multi",
			},
		],
		responses: {
			200: {
				description: "successful operation",
				schema: {
					type: "array",
					items: {
						$ref: "#/definitions/Pet",
					},
				},
			},
			400: {
				description: "Invalid tag value",
			},
		},
		deprecated: true,
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /pet/findByTags");
	});

api.get("/pet/{petId}", {
		tags: [
			"pet",
		],
		summary: "Find pet by ID",
		description: "Returns a single pet",
		operationId: "getPetById",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "petId",
				in: "path",
				description: "ID of pet to return",
				required: true,
				type: "integer",
				format: "int64",
			},
		],
		responses: {
			200: {
				description: "successful operation",
				schema: {
					$ref: "#/definitions/Pet",
				},
			},
			400: {
				description: "Invalid ID supplied",
			},
			404: {
				description: "Pet not found",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /pet/{petId}");
	});

api.post("/pet/{petId}", {
		tags: [
			"pet",
		],
		summary: "Updates a pet in the store with form data",
		description: "",
		operationId: "updatePetWithForm",
		consumes: [
			"application/x-www-form-urlencoded",
		],
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "petId",
				in: "path",
				description: "ID of pet that needs to be updated",
				required: true,
				type: "integer",
				format: "int64",
			},
			{
				name: "name",
				in: "formData",
				description: "Updated name of the pet",
				required: false,
				type: "string",
			},
			{
				name: "status",
				in: "formData",
				description: "Updated status of the pet",
				required: false,
				type: "string",
			},
		],
		responses: {
			405: {
				description: "Invalid input",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /pet/{petId}");
	});

api.delete("/pet/{petId}", {
		tags: [
			"pet",
		],
		summary: "Deletes a pet",
		description: "",
		operationId: "deletePet",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "api_key",
				in: "header",
				required: false,
				type: "string",
			},
			{
				name: "petId",
				in: "path",
				description: "Pet id to delete",
				required: true,
				type: "integer",
				format: "int64",
			},
		],
		responses: {
			400: {
				description: "Invalid ID supplied",
			},
			404: {
				description: "Pet not found",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /pet/{petId}");
	});

api.post("/pet/{petId}/uploadImage", {
		tags: [
			"pet",
		],
		summary: "uploads an image",
		description: "",
		operationId: "uploadFile",
		consumes: [
			"multipart/form-data",
		],
		produces: [
			"application/json",
		],
		parameters: [
			{
				name: "petId",
				in: "path",
				description: "ID of pet to update",
				required: true,
				type: "integer",
				format: "int64",
			},
			{
				name: "additionalMetadata",
				in: "formData",
				description: "Additional data to pass to server",
				required: false,
				type: "string",
			},
			{
				name: "file",
				in: "formData",
				description: "file to upload",
				required: false,
				type: "string",
			},
		],
		responses: {
			200: {
				description: "successful operation",
				schema: {
					$ref: "#/definitions/ApiResponse",
				},
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /pet/{petId}/uploadImage");
	});

api.get("/store/inventory", {
		tags: [
			"store",
		],
		summary: "Returns pet inventories by status",
		description: "Returns a map of status codes to quantities",
		operationId: "getInventory",
		produces: [
			"application/json",
		],
		parameters: [],
		responses: {
			200: {
				description: "successful operation",
				schema: {
					type: "object",
					additionalProperties: {
						type: "integer",
						format: "int32",
					},
				},
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /store/inventory");
	});

api.post("/store/order", {
		tags: [
			"store",
		],
		summary: "Place an order for a pet",
		description: "",
		operationId: "placeOrder",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				in: "body",
				name: "body",
				description: "order placed for purchasing the pet",
				required: true,
				schema: {
					$ref: "#/definitions/Order",
				},
			},
		],
		responses: {
			200: {
				description: "successful operation",
				schema: {
					$ref: "#/definitions/Order",
				},
			},
			400: {
				description: "Invalid Order",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /store/order");
	});

api.get("/store/order/{orderId}", {
		tags: [
			"store",
		],
		summary: "Find purchase order by ID",
		description: "For valid response try integer IDs with value",
		operationId: "getOrderById",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "orderId",
				in: "path",
				description: "ID of pet that needs to be fetched",
				required: true,
				type: "integer",
				maximum: 10,
				minimum: 1,
				format: "int64",
			},
		],
		responses: {
			200: {
				description: "successful operation",
				schema: {
					$ref: "#/definitions/Order",
				},
			},
			400: {
				description: "Invalid ID supplied",
			},
			404: {
				description: "Order not found",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /store/order/{orderId}");
	});

api.delete("/store/order/{orderId}", {
		tags: [
			"store",
		],
		summary: "Delete purchase order by ID",
		description: "For valid response try integer IDs with positive integer value. Negative or non-integer values" +
		" will generate API errors",
		operationId: "deleteOrder",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "orderId",
				in: "path",
				description: "ID of the order that needs to be deleted",
				required: true,
				type: "integer",
				minimum: 1,
				format: "int64",
			},
		],
		responses: {
			400: {
				description: "Invalid ID supplied",
			},
			404: {
				description: "Order not found",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /store/order/{orderId}");
	});

api.post("/user/createWithArray", {
		tags: [
			"user",
		],
		summary: "Creates list of users with given input array",
		description: "",
		operationId: "createUsersWithArrayInput",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				in: "body",
				name: "body",
				description: "List of user object",
				required: true,
				schema: {
					type: "array",
					items: {
						$ref: "#/definitions/User",
					},
				},
			},
		],
		responses: {
			default: {
				description: "successful operation",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /user/createWithArray");
	});

api.post("/user/createWithList", {
		tags: [
			"user",
		],
		summary: "Creates list of users with given input array",
		description: "",
		operationId: "createUsersWithListInput",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				in: "body",
				name: "body",
				description: "List of user object",
				required: true,
				schema: {
					type: "array",
					items: {
						$ref: "#/definitions/User",
					},
				},
			},
		],
		responses: {
			default: {
				description: "successful operation",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /user/createWithList");
	});

api.get("/user/login", {
		tags: [
			"user",
		],
		summary: "Logs user into the system",
		description: "",
		operationId: "loginUser",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "username",
				in: "query",
				description: "The user name for login",
				required: true,
				type: "string",
			},
			{
				name: "password",
				in: "query",
				description: "The password for login in clear text",
				required: true,
				type: "string",
			},
		],
		responses: {
			200: {
				description: "successful operation",
				schema: {
					type: "string",
				},
				headers: {
					"X-Rate-Limit": {
						type: "integer",
						format: "int32",
						description: "calls per hour allowed by the user",
					},
					"X-Expires-After": {
						type: "string",
						format: "date-time",
						description: "date in UTC when token expires",
					},
				},
			},
			400: {
				description: "Invalid username/password supplied",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /user/login");
	});

api.get("/user/logout", {
		tags: [
			"user",
		],
		summary: "Logs out current logged in user session",
		description: "",
		operationId: "logoutUser",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [],
		responses: {
			default: {
				description: "successful operation",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /user/logout");
	});

api.get("/user/{username}", {
		tags: [
			"user",
		],
		summary: "Get user by user name",
		description: "",
		operationId: "getUserByName",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "username",
				in: "path",
				description: "The name that needs to be fetched. Use user1 for testing. ",
				required: true,
				type: "string",
			},
		],
		responses: {
			200: {
				description: "successful operation",
				schema: {
					$ref: "#/definitions/User",
				},
			},
			400: {
				description: "Invalid username supplied",
			},
			404: {
				description: "User not found",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /user/{username}");
	});

api.put("/user/{username}", {
		tags: [
			"user",
		],
		summary: "Updated user",
		description: "This can only be done by the logged in user.",
		operationId: "updateUser",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "username",
				in: "path",
				description: "name that need to be updated",
				required: true,
				type: "string",
			},
			{
				in: "body",
				name: "body",
				description: "Updated user object",
				required: true,
				schema: {
					$ref: "#/definitions/User",
				},
			},
		],
		responses: {
			400: {
				description: "Invalid user supplied",
			},
			404: {
				description: "User not found",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /user/{username}");
	});

api.delete("/user/{username}", {
		tags: [
			"user",
		],
		summary: "Delete user",
		description: "This can only be done by the logged in user.",
		operationId: "deleteUser",
		produces: [
			"application/xml",
			"application/json",
		],
		parameters: [
			{
				name: "username",
				in: "path",
				description: "The name that needs to be deleted",
				required: true,
				type: "string",
			},
		],
		responses: {
			400: {
				description: "Invalid username supplied",
			},
			404: {
				description: "User not found",
			},
		},
	},
	(req: ApiRequest) => {
		return api.buildError("UnimplementedEndpoint", "Unimplemented Endpoint: /user/{username}");
	});

const endpointsEnd = process.hrtime(endpointsStart);
const endpointsTime = convertTime(endpointsEnd);
timings.endpoints = timeFmt(endpointsTime);
timings.total = timeFmt(loadTime + createTime + endpointsTime);

console.log(JSON.stringify(timings, null , 2));
const ex = api.start({port: 8080});
module.exports = {
	valory: ex.valory,
	server: (api as any).server.instance,
};
