import {HttpMethod} from "../../lib/common/headers";
import {CompiledSchemaInteraction, CompiledSchemaOperation} from "./compile-validator";

const ERROR_VAR = "validationErrors";
const SCHEMA_VAR = "schema";

export interface ProcessedCompiledSchemaOperation {
    path: string;
    method: HttpMethod;
    schemaInteractions: ProcessedCompiledSchemaInteraction[]
}

export interface ProcessedCompiledSchemaInteraction extends CompiledSchemaInteraction {
    processedValidatorSource: string;
}

export function processCompiledSchemaOperation(input: CompiledSchemaOperation): ProcessedCompiledSchemaOperation {
    return {
        ...input,
        schemaInteractions: input.schemaInteractions.map(processCompiledSchemaInteraction)
    }
}

function processCompiledSchemaInteraction(input: CompiledSchemaInteraction): ProcessedCompiledSchemaInteraction {
    let processedCode = input.validator.toString();



    // Protect data properties from mangling
    processedCode = processedCode.replace(/(data[A-Za-z_$0-9]*?)\.([A-Za-z_$0-9]+)/g, '$1["$2"]');
    processedCode = processedCode.replace(/ ([a-zA-Z]+):/g, ' "$1":');

    // Protect error property from being mangled
    processedCode = processedCode.replace(/validate.errors/g, "validate[\"errors\"]");
    processedCode = processedCode.replace(/validate.schema/g, "validate[\"schema\"]");

    const functionHeader = processedCode.substring(0, processedCode.indexOf("{"));
    const functionBody = processedCode.substring(processedCode.indexOf("{") + 1, processedCode.lastIndexOf("}"));

    const finalCode = `
        function() {
            ${(input.validator.source as any).patterns.map((pattern: string, id: number) => {
                return `const pattern${id} = new RegExp(\`${pattern}\`);`
            }).join("\n")}
            const validate = ${functionHeader} {
                ${functionBody}
            };
            validate.schema = ${JSON.stringify(input.schema)};
            return validate;
        }()
    `;

    return {
        ...input,
        processedValidatorSource: finalCode
    }
}
