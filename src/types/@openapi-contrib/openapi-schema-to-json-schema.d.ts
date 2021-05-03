declare module "@openapi-contrib/openapi-schema-to-json-schema" {
    import {OpenAPIV3} from "openapi-types";
    import {JSONSchema4} from "json-schema";

    export interface Options {
        cloneSchema?: boolean;
        dateToDateTime?: boolean;
        keepNotSupported?: boolean;
        removeReadOnly?: boolean;
        removeWriteOnly?: boolean;
        supportPatternProperties?: boolean;
    }

    export function fromSchema(schema: OpenAPIV3.SchemaObject, options?: Options): JSONSchema4;

    export function fromParameter(parameter: OpenAPIV3.ParameterObject, options?: Options): JSONSchema4 | {[media: string]: JSONSchema4};
}
