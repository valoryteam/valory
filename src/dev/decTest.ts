import "./decRoute";
import {
	Valory, ErrorDef, ApiRequest, ApiMiddleware, ApiResponse, Swagger, Route, Get, Post, Body, Header, DefaultAdaptor,
} from "../main";
// Define basic info for the api
const info: Swagger.Info = {
	title: "CNP POC API",
	version: "1",
};
const definitions: {[name: string]: Swagger.Schema} = {};
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
});
// Build and export the app, passing any adaptor specific config data
api.start({port: process.env.PORT || 8080});
