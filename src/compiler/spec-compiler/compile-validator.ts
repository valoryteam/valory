import {HttpMethod} from "../../lib/common/headers";
import {SchemaInteraction, SchemaOperation} from "./schema-operation";
import ajv = require("ajv");
import {JSONSchema4} from "json-schema";
import {ValidateFunction} from "ajv";

const Ajv = new ajv({
    removeAdditional: false,
    sourceCode: true,
    useDefaults: "shared",
    allErrors: false,
    unknownFormats: ["double", "int32", "int64", "float", "byte"],
});

export interface CompiledSchemaOperation {
    path: string;
    method: HttpMethod;
    schemaInteractions: CompiledSchemaInteraction[];
}

export interface CompiledSchemaInteraction {
    statusCode?: number;
    validator: ValidateFunction;
    schema: JSONSchema4;
}

export function compileSchemaOperation(input: SchemaOperation): CompiledSchemaOperation {
    return {
        ...input,
        schemaInteractions: input.schemaInteractions.map(compileSchemaInteraction)
    }
}

function compileSchemaInteraction(input: SchemaInteraction): CompiledSchemaInteraction {
    const compiled = Ajv.compile(input.schema);
    return {
        ...input,
        validator: compiled
    }
}
