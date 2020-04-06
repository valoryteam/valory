import {HttpMethod} from "../../lib/common/headers";
import {OpenAPIV3} from "openapi-types";
import {Operation} from "./operations";
import {JSONSchema4} from "json-schema";
import {fromSchema} from "@openapi-contrib/openapi-schema-to-json-schema";
import {isReferenceObject} from "../../lib/common/util";

export interface SchemaOperation {
    path: string;
    method: HttpMethod;
    schemaInteractions: SchemaInteraction[];
}

export interface SchemaInteraction {
    statusCode?: number;
    schema: JSONSchema4;
}

export function generateSchemaOperation(input: Operation): SchemaOperation {
    return {
        method: input.method,
        path: input.path,
        schemaInteractions: [...generateSchemaResponse(input.operation), generateSchemaRequest(input.operation)]
    };
}

function processParameter(input: OpenAPIV3.RequestBodyObject | OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject): JSONSchema4 {
    if (isReferenceObject(input)) {throw Error("Unresolved $ref. How did this happen");}
    const outerSchema: JSONSchema4 = {properties: {}};
    const location = resolveParameterLocation(input);
    if (input.required) {outerSchema.required = [location];}
    const innerSchema = fromSchema(resolveParameterOASchema(input), {cloneSchema: true});
    if (location === "body") {
        outerSchema.properties.body = innerSchema;
    } else {
        const param = input as OpenAPIV3.ParameterObject;
        const property: JSONSchema4 = {properties: {}};
        property.properties[param.name] = innerSchema;
        if (param.required) {property.required = [param.name];}
        outerSchema.properties[location] = property;
    }
    return outerSchema;
}

function resolveParameterOASchema(input: OpenAPIV3.RequestBodyObject | OpenAPIV3.ParameterObject): OpenAPIV3.SchemaObject {
    const contentEntries = Object.values(input.content || {});
    if (contentEntries.length > 1) { throw Error("Only a single content type is supported");}
    const schema = (input as OpenAPIV3.ParameterObject).schema ?
        (input as OpenAPIV3.ParameterObject).schema :
        contentEntries[0]?.schema || {type: "null"};

    if (isReferenceObject(schema)) {throw Error("Unresolved $ref. How did this happen?");}
    return schema;
}

function resolveParameterLocation(input: OpenAPIV3.RequestBodyObject | OpenAPIV3.ParameterObject): string {
    const location = (input as OpenAPIV3.ParameterObject).in || "body";
    switch (location) {
        case "query":
            return "queryParams";
        case "path":
            return "pathParams";
        case "header":
            return "headers";
        case "cookie":
            throw Error("Cookie parameters are not supported at this time");
        default:
            return location;
    }
}

function generateSchemaRequest(operation: OpenAPIV3.OperationObject): SchemaInteraction {
    const schemas = operation.parameters?.map(processParameter) || [];
    if (operation.requestBody != null) {
        schemas.push(processParameter(operation.requestBody));
    }
    return {
        schema: {
            allOf: schemas
        }
    };
}

function generateSchemaResponse(operation: OpenAPIV3.OperationObject): SchemaInteraction[] {
    return Object.entries(operation.responses).map(([code, response]) => {
        if (isReferenceObject(response)) { throw Error("Unresolved $ref. How did this happen?"); }
        const schemas = Object.entries(response.headers || []).map(([name, header]) => {
            return {
                in: "header",
                name,
                ...header
            };
        }).map(processParameter);
        schemas.push(processParameter({content: response.content, required: true}));
        return {
            schema: {
                allOf: schemas,
            },
            statusCode: +code,
        };
    });
}
