import {OpenAPIV3} from "openapi-types";
import {validate} from "swagger-parser";
import {Spinner, spinnerFail, spinnerWrap} from "../../lib/spinner";
import chalk = require("chalk");
import {generateOperations, Operation} from "./operations";
import {generateSchemaOperation, SchemaOperation} from "./schema-operation";
import mergeAllOf = require("json-schema-merge-allof");
import {CompiledSchemaOperation, compileSchemaOperation} from "./compile-validator";
import {processCompiledSchemaOperation, ProcessedCompiledSchemaOperation} from "./process-validator";
import {generateModule} from "./generate-module";
import {compileModule} from "./compile-module";
import {cloneDeep,} from "lodash";

// tslint:disable-next-line:no-empty-interface
export interface CompilerOptions {
    allErrors: boolean;
    coerceTypes: boolean;
    prepackErrors: boolean;
}

export interface SpecCompilerOutput {
    initialInput?: OpenAPIV3.Document;
    mangledSpec?: OpenAPIV3.Document;
    dereferencedSpec?: OpenAPIV3.Document;
    operations?: Operation[];
    schemaOperations?: SchemaOperation[];
    schemaOperationsOpt?: SchemaOperation[];
    compiledSchemaOperations?: CompiledSchemaOperation[];
    processedCompiledSchemaOperations?: ProcessedCompiledSchemaOperation[];
    moduleSource?: string;
    moduleCompiled?: string;
}

export const DefaultCompilerOptions: CompilerOptions = {
    allErrors: false,
    coerceTypes: false,
    prepackErrors: true,
};

export class SpecCompiler {
    private output: SpecCompilerOutput = {};
    private options: CompilerOptions;

    constructor(
        private input: OpenAPIV3.Document,
        options: Partial<CompilerOptions>,
    ) {
        this.options = {
            ...DefaultCompilerOptions,
            ...options
        }
    }

    public async compile(): Promise<string> {
        console.log(chalk.bold("Spec Compilation"));
        this.output.initialInput = this.input;
        this.output.dereferencedSpec = await spinnerWrap(validate(cloneDeep(this.output.initialInput)), "Validating Spec") as OpenAPIV3.Document;
        this.output.operations = await spinnerWrap(generateOperations(this.output.dereferencedSpec), "Generating Operations");
        this.output.schemaOperations = await spinnerWrap(this.output.operations.map(generateSchemaOperation), "Generating Operation Schemas");
        this.output.schemaOperationsOpt = await spinnerWrap(this.output.schemaOperations.map(op => {
            return {
                ...op,
                schemaInteractions: op.schemaInteractions.map(interaction => {
                    return {
                        ...interaction,
                        schema: mergeAllOf(interaction.schema)
                    }
                })
            }
        }), "Optimizing Operation Schemas");
        this.output.compiledSchemaOperations = await spinnerWrap(this.output.schemaOperationsOpt.map(op => compileSchemaOperation(op, {
            coerceTypes: this.options.coerceTypes,
            allErrors: this.options.allErrors
        })), "Compiling Operation Schemas");
        this.output.processedCompiledSchemaOperations = await spinnerWrap(this.output.compiledSchemaOperations.map(op => processCompiledSchemaOperation(op, {prepackErrors: this.options.prepackErrors})), "Processing Compiled Schemas");
        this.output.moduleSource = await spinnerWrap(generateModule(this.output.processedCompiledSchemaOperations, this.input), "Generating Module");
        this.output.moduleCompiled = await spinnerWrap(compileModule(this.output.moduleSource), "Compiling Module");
        return this.output.moduleCompiled;
    }
}
