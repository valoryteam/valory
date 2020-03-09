import {OpenAPIV3} from "openapi-types";
import {validate, dereference} from "swagger-parser";
import {Spinner, spinnerFail, spinnerWrap} from "../../lib/spinner";
import chalk = require("chalk");
import {generateOperations, Operation} from "./operations";
import {generateSchemaOperation, SchemaOperation} from "./schema-operation";
import mergeAllOf = require("json-schema-merge-allof");
import {CompiledSchemaOperation, compileSchemaOperation} from "./compile-validator";
import {processCompiledSchemaOperation, ProcessedCompiledSchemaOperation} from "./process-validator";
import {generateModule} from "./generate-module";
import {compileModule} from "./compile-module";

// tslint:disable-next-line:no-empty-interface
export interface CompilerOptions {

}

export interface CompilerOutput {
    initialInput?: OpenAPIV3.Document;
    dereferencedSpec?: OpenAPIV3.Document;
    operations?: Operation[];
    schemaOperations?: SchemaOperation[];
    schemaOperationsOpt?: SchemaOperation[];
    compiledSchemaOperations?: CompiledSchemaOperation[];
    processedCompiledSchemaOperations?: ProcessedCompiledSchemaOperation[];
    moduleSource?: string;
    moduleCompiled?: string;
}

export class SpecCompiler {
    private output: CompilerOutput = {};

    constructor(
        private input: OpenAPIV3.Document,
        private options: CompilerOptions,
    ) {}

    public async compile(): Promise<string> {
        console.log(chalk.bold("Spec Compilation"));
        this.output.initialInput = this.input;
        this.output.dereferencedSpec = await spinnerWrap(validate(this.input), "Validating Spec") as OpenAPIV3.Document;
        this.output.operations = await spinnerWrap(generateOperations(this.output.dereferencedSpec), "Generating Operations");
        this.output.schemaOperations = await spinnerWrap(this.output.operations.map(generateSchemaOperation), "Generating Operation Schemas");
        this.output.schemaOperationsOpt = await spinnerWrap(this.output.schemaOperations.map(op=>{
            return {
                ...op,
                schemaInteractions: op.schemaInteractions.map(interaction=>{
                    return {
                        ...interaction,
                        schema: mergeAllOf(interaction.schema)
                    }
                })
            }
        }),"Optimizing Operation Schemas");
        this.output.compiledSchemaOperations = await spinnerWrap(this.output.schemaOperationsOpt.map(compileSchemaOperation), "Compiling Operation Schemas");
        this.output.processedCompiledSchemaOperations = await spinnerWrap(this.output.compiledSchemaOperations.map(processCompiledSchemaOperation), "Processing Compiled Schemas");
        this.output.moduleSource = await spinnerWrap(generateModule(this.output.processedCompiledSchemaOperations, this.input), "Generating Module");
        this.output.moduleCompiled = await spinnerWrap(compileModule(this.output.moduleSource), "Compiling Module");
        return this.output.moduleCompiled;
    }
}
