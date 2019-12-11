import chalk from "chalk";
import * as fs from "fs";
import {cloneDeep, escapeRegExp, merge} from "lodash";
import {join} from "path";
import {dereference, validate} from "swagger-parser";
import {ClosureCompiler} from "../lib/closureCompiler";
import {COMPSWAG_VERION} from "../lib/config";
import {build as fastJson, preamble} from "../lib/fastStringify";
import {sha1String} from "../lib/helpers";
import {Spinner, spinnerFail} from "../lib/spinner";
import {Swagger} from "../server/swagger";
import {VALORYPRETTYLOGGERVAR} from "../server/valoryheaders";
import {
    CompilationLevel,
    CompilerOutput,
    FUNCTION_PREFIX,
    ICompilerOptions,
    SERIALIZER_SUFFIX,
    ValidatorModuleContent,
} from "./compilerheaders";
import {compileMethodSchema} from "./method";
import {mangleKeys, resolve, schemaPreprocess, swaggerPreproccess} from "./preprocessor";
import {ValueCache} from "./valueCache";
import Pino = require("pino");

const Ajv = require("ajv");

export const CompileLog = Pino({prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true"});
const tmp = require("tmp");
const dotJs = require("dot");
dotJs.log = false;
const templates = dotJs.process({path: join(__dirname, "../../templates")});
const errorSup = "undefinedVars";

export const DisallowedFormats = ["float", "double", "int32", "int64", "byte", "binary"];

// TODO: Fix discriminator errors
export async function compile(spec: Swagger.Spec, options?: ICompilerOptions) {

    const output: CompilerOutput = {
        success: false,
        module: null,
        debugArtifacts: {
            stringCache: new ValueCache(),
            hashes: [],
            functionNames: [],
            serializerHashes: [],
            serializerFunctionNames: [],
            preSwagger: null,
            derefSwagger: null,
            initialSchema: [],
            processedSchema: [],
            initialCompiles: [],
            mangledSchema: [],
            intermediateFunctions: [],
            intermediateModule: null,
            postCompileModule: null,
            serializers: [],
            closureOutput: {
                exitCode: null,
                stderr: null,
                stdout: null,
            },
        },
    };

    const defaultCompilerOptions: ICompilerOptions = {
        requestFieldMapping: {
            body: "body",
            formData: "formData",
            header: "headers",
            path: "path",
            query: "query",
        },
        undocumentedEndpoints: [],
        debug: false,
        singleError: true,
        compilationLevel: CompilationLevel.ADVANCED,
        discrimFastFail: false,
        disableSerialization: [],
    };

    merge(defaultCompilerOptions, options);
    options = defaultCompilerOptions;
    const ajv = new Ajv({
        coerceTypes: true,
        useDefaults: "shared",
        sourceCode: true,
        errorDataPath: "property",
        unicode: false,
        allErrors: !options.singleError,
        removeAdditional: true,
    });
    // if (options.discrimFastFail) {
    //     CompileLog.warn("discriminator fast fail is enabled EXPERIMENTAL");
    // }
    // const start = process.hrtime();
    console.log(chalk.bold("Prepare Swagger"));
    // CompileLog.info("Validating swagger");
    await Spinner.start("Validating Swagger");
    try {
        await validate(cloneDeep(spec as any));
    } catch (e) {
        await spinnerFail("Swagger Validation Failure", e, false);
        return output;
    }
    await Spinner.succeed();
    // CompileLog.info("Preprocessing swagger");
    Spinner.start("Preprocessing Swagger");
    try {
        output.debugArtifacts.preSwagger = swaggerPreproccess(cloneDeep(spec as any));
    } catch (e) {
        await spinnerFail("Swagger Preprocessor Failure", e, false);
        return output;
    }
    await Spinner.succeed();
    Spinner.start("Dereferencing Swagger");
    try {
        output.debugArtifacts.derefSwagger = await dereference(output.debugArtifacts.preSwagger.swagger as any);
    } catch (e) {
        await spinnerFail("Swagger Dereference Failure", e, false);
        return output;
    }
    await Spinner.succeed();
    console.log(chalk.bold("Build Endpoints"));
    for (const path of Object.keys(output.debugArtifacts.derefSwagger.paths)) {
        for (const method of Object.keys(output.debugArtifacts.derefSwagger.paths[path])) {
            await Spinner.start("Building endpoint");
            try {
                const functionName = `${path}:${method.toUpperCase()}`;
                const hash = FUNCTION_PREFIX + sha1String(functionName);
                const endpointLogger = CompileLog.child({endpoint: `${path}:${method}`, hash});
                // endpointLogger.info("Building method schema");
                const schema = compileMethodSchema((output.debugArtifacts.derefSwagger.paths[path] as any)
                    [method], method, path, options.requestFieldMapping);
                const schemaProcessed = schemaPreprocess(schema);
                const initialCompile = ajv.compile(schemaProcessed.schema);
                resolve(schemaProcessed.resQueue);
                const mangled = mangleKeys(schemaProcessed.schema);
                const templated = templates.validatorTemplate({
                    validate: initialCompile,
                    funcName: path,
                    localConsumes: (output.debugArtifacts.derefSwagger.paths[path] as any)[method].consumes,
                    hash,
                    stringCache: output.debugArtifacts.stringCache,
                    format: (ajv as any)._opts.format,
                    mangledKeys: mangled.mangledKeys,
                    schema: mangled.schema,
                    singleError: options.singleError,
                    discriminators: output.debugArtifacts.preSwagger.discriminators,
                    discrimFastFail: options.discrimFastFail,
                    lodash: require("lodash"),
                });
                if (options.disableSerialization.indexOf(`${path}:${method.toUpperCase()}`) === -1 &&
                    (output.debugArtifacts.derefSwagger.paths[path] as any)[method].responses["200"] != null &&
                    (output.debugArtifacts.derefSwagger.paths[path] as any)[method].responses["200"].schema != null) {
                    const serializerHash = hash + SERIALIZER_SUFFIX;
                    const serializerName = functionName + SERIALIZER_SUFFIX;
                    const generatedSerializer = fastJson((output.debugArtifacts.derefSwagger.paths[path] as any)
                        [method].responses["200"].schema);
                    const serializer = templates.serializerTemplate({
                        hash: serializerHash,
                        stringCache: output.debugArtifacts.stringCache,
                        serializerCode: generatedSerializer.code,
                        serializerName: generatedSerializer.funcName,
                        serializerNameEscaped: escapeRegExp(generatedSerializer.funcName),
                        schema: (output.debugArtifacts.derefSwagger.paths[path] as any)[method].responses["200"].schema,
                    });
                    output.debugArtifacts.serializerFunctionNames.push(serializerName);
                    output.debugArtifacts.serializerHashes.push(serializerHash);
                    output.debugArtifacts.serializers.push(serializer);
                }
                output.debugArtifacts.hashes.push(hash);
                output.debugArtifacts.functionNames.push(functionName);
                output.debugArtifacts.initialSchema.push(schema);
                output.debugArtifacts.intermediateFunctions.push(templated);
                output.debugArtifacts.processedSchema.push(schemaProcessed.schema);
                output.debugArtifacts.initialCompiles.push(initialCompile);
                output.debugArtifacts.mangledSchema.push(mangled);
                await Spinner.succeed(`${path}:${method}`);
            } catch (err) {
                await spinnerFail(`Failed to build ${path}:${method}`, err, true);
                return output;
            }
        }
    }
    console.log(chalk.bold("Compile"));
    await Spinner.start("Building intermediate module");
    output.debugArtifacts.intermediateModule = templates.moduleTemplate({
        validatorLib: output.debugArtifacts.intermediateFunctions.concat(output.debugArtifacts.serializers),
        defHash: sha1String(JSON.stringify(spec.definitions)),
        exportHashes: output.debugArtifacts.hashes.concat(output.debugArtifacts.serializerHashes),
        exportNames: output.debugArtifacts.functionNames.concat(output.debugArtifacts.serializerFunctionNames),
        swagger: spec,
        stringCache: output.debugArtifacts.stringCache.generate(),
        preamble,
        undocumentedEndpoints: options.undocumentedEndpoints,
        compswagVersion: COMPSWAG_VERION,
    });

    const intermediateTemp = tmp.fileSync({prefix: "valCI"});
    fs.writeSync(intermediateTemp.fd, output.debugArtifacts.intermediateModule);
    const outputTemp = tmp.fileSync({prefix: "valC"});

    const compilerFlags = {
        js: intermediateTemp.name,
        rewrite_polyfills: false,
        compilation_level: CompilationLevel[options.compilationLevel],
        use_types_for_optimization: true,
        preserve_type_annotations: true,
        js_output_file: outputTemp.name,
        language_out: "ECMASCRIPT_2016",
        debug: options.debug,
        jscomp_off: errorSup,
    };
    await Spinner.succeed();
    await Spinner.start("Running Closure Compiler: " + CompilationLevel[options.compilationLevel]);
    try {
        await new Promise((resol, reject) => {
            new ClosureCompiler(compilerFlags).run((exitCode: number, stdout: string, stderr: string) => {
                output.debugArtifacts.closureOutput.stderr = stderr;
                output.debugArtifacts.closureOutput.stdout = stdout;
                output.debugArtifacts.closureOutput.exitCode = exitCode;

                if (!exitCode) {
                    output.debugArtifacts.postCompileModule =
                        fs.readFileSync(outputTemp.name, {encoding: "utf8"}) as ValidatorModuleContent;
                    resol();
                } else {
                    reject(stderr);
                }
            });
        });
    } catch (e) {
        await spinnerFail("Closure Compiler Failure", e, false);
        return output;
    }
    await Spinner.succeed(`Running Closure Compiler: ${CompilationLevel[options.compilationLevel]}` );
    await Spinner.start("Final post process");
    output.module = finalProcess(output.debugArtifacts.postCompileModule);
    await Spinner.succeed();
    // console.log("\nDone", (convertTime(process.hrtime(start)) / 1000).toFixed(3) + "s");
    output.success = true;
    return output;
}

function finalProcess(content: ValidatorModuleContent): ValidatorModuleContent {
    "use strict";
    const trueReg = /!0/g;
    const falseReg = /!1/g;
    const nullReg = /void 0/g;
    const arrayify = /([a-zA-Z]*?)=\"([a-zA-Z ]+?)\".split\(\" \"\)/gm;
    // const arrayCheckReg = /Array.isArray\(([a-zA-Z]*?)\)/g;

    // let ret = content.replace(trueReg, " true");
    // ret = ret.replace(falseReg, " false");
    // ret = ret.replace(nullReg, "undefined");
    const ret = content.replace(arrayify, (match, varName, value) => {
        return `${varName}=${JSON.stringify(value.split(" "))}`;
    });
    // ret = ret.replace(arrayCheckReg,"($1 instanceof Array)");

    return ret;
}
