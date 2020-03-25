import {HttpMethod} from "../../lib/common/headers";
import {SchemaInteraction, SchemaOperation} from "./schema-operation";
import ajv = require("ajv");
import {JSONSchema4} from "json-schema";
import {Ajv, ValidateFunction} from "ajv";

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

export function compileSchemaOperation(input: SchemaOperation, options: {coerceTypes: boolean | "array", allErrors: boolean}): CompiledSchemaOperation {
    const compiler = new ajv({
        removeAdditional: false,
        sourceCode: true,
        useDefaults: "shared",
        allErrors: options.allErrors,
        coerceTypes: options.coerceTypes,
        unknownFormats: ["double", "int32", "int64", "float", "byte"],
    });

    return {
        ...input,
        schemaInteractions: input.schemaInteractions.map(op => compileSchemaInteraction(compiler, op))
    }
}

function compileSchemaInteraction(compiler: Ajv, input: SchemaInteraction): CompiledSchemaInteraction {
    const compiled = compiler.compile(input.schema);
    return {
        ...input,
        validator: compiled
    }
}
