import {each} from "lodash";
import {ExtendedSchema, RequestFieldMap} from "./compilerheaders";
import {Swagger} from "../server/swagger";

export interface MethodOutput {
	schema: Swagger.Schema;
	hash: string;
}

export function compileMethodSchema(operation: Swagger.Operation, method: string, pathName: string,
									requestObjectMap: RequestFieldMap): Swagger.Schema {
	const schema: ExtendedSchema = {
		properties: {},
		required: [],
		type: "object",
	};
	const addProperty = (param: Swagger.Parameter) => {
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
		switch ((parameter as Swagger.BaseParameter).in) {
			case "body":
				schema.properties.body = (parameter as Swagger.BodyParameter).schema;
				if (!schema.required) {
					schema.required = [];
				}
				schema.required.push("body");
				break;
			case "header":
				(parameter as Swagger.BaseParameter).name = (parameter as Swagger.BaseParameter).name.toLowerCase();
			case "formData":
			case "query":
			case "path":
				addProperty((parameter as any));
		}
	});

	return schema;
}
