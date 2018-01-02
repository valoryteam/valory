import {each, forEach} from "lodash";
import {BodyParameter, Operation, Parameter, Schema} from "swagger-schema-official";
import {DisallowedFormats, ExtendedSchema, RequestFieldMap} from "./compiler";
const stringify = require("fast-json-stable-stringify");

export interface MethodOutput {
	schema: Schema;
	hash: string;
}

export function compileMethodSchema(operation: Operation, method: string, pathName: string,
									requestObjectMap: RequestFieldMap): Schema {
	const schema: ExtendedSchema = {
		properties: {},
		required: [],
		type: "object",
	};
	const addProperty = (param: Parameter) => {
		const requestField = requestObjectMap[param.in];
		let requestFieldObj = schema.properties[requestField];
		const prop: any = {};
		if (!requestFieldObj) {
			requestFieldObj = schema.properties[requestField] = {
				properties: {},
				required: undefined,
				type: "object",
			};
		}
		requestFieldObj.properties[param.name] = prop;
		for (const key of Object.keys(param)) {
			switch (key) {
				case "description":
				case "in":
				case "name":
				case "required":
					break;
				default:
					prop[key] = (param as any)[key];
			}
		}
		if (param.required) {
			if (requestFieldObj.required == null) {
				requestFieldObj.required = [];
			}
			if (requestFieldObj.required.indexOf(param.name)) {
				requestFieldObj.required.push(param.name);
			}
			if (schema.required == null) {
				schema.required = [];
			}
			if (schema.required.indexOf(requestField) < 0) {
				schema.required.push(requestField);
			}
		}
	};

	each(operation.parameters, (parameter) => {
		switch (parameter.in) {
			case "body":
				schema.properties.body = (parameter as BodyParameter).schema;
				if (!schema.required) {
					schema.required = [];
				}
				schema.required.push("body");
				break;
			case "header":
				parameter.name = parameter.name.toLowerCase();
			case "formData":
			case "query":
			case "path":
				addProperty(parameter);
		}
	});

	return schema;
}