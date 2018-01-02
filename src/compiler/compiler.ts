import {cloneDeep, merge} from "lodash";
import {dereference, validate} from "swagger-parser";
import {Schema, Spec} from "swagger-schema-official";
import {MangledKey, mangleKeys, schemaPreprocess, swaggerPreproccess} from "./preprocessor";
import {compileMethodSchema} from "./method";
import * as Ajv from "ajv";
import {listenerCount} from "cluster";
import {metrohash64} from "metrohash";
import * as fs from "fs";

const beautifier = require("js-beautify").js_beautify;
const ClosureCompiler = require("google-closure-compiler").compiler;
const tmp = require("tmp");
const templates = require("dot").process({path: "../../templates"});
const stringify = require("fast-json-stable-stringify");
const errorSup = "undefinedVars";

export interface ExtendedSchema extends Schema {
	const?: any;
	oneOf?: ExtendedSchema[];
}

export interface RequestFieldMap {
	header: string;
	body: string;
	formData: string;
	query: string;
	path: string;
	[key: string]: string;
}

export interface ValidatorModule {
	defHash: string;
	globalConsume: string[];
	swaggerBlob: string;
	validate: (path: string, method: string, data: any) => string | string[];
}

export type ValidatorModuleContent = string;

export interface CompilerOutput {
	module: ValidatorModuleContent;
	debugArtifacts?: {
		hashes: string[];
		preSwagger: Spec;
		derefSwagger: Spec;
		initialSchema: ExtendedSchema[];
		processedSchema: ExtendedSchema[];
		initialCompiles: any[];
		mangledSchema: Array<{schema: ExtendedSchema, mangledKeys: MangledKey[]}>;
		intermediateFunctions: string[];
		intermediateModule: ValidatorModuleContent;
		postCompileModule: ValidatorModuleContent;
		closureOutput: {stdout: string, stderr: string, exitCode: number};
	};
}

export enum CompilationLevel {
	"ADVANCED",
	"WHITESPACE_ONLY",
	"SIMPLE",
}

export interface ICompilerOptions {
	debug?: boolean;
	requestFieldMapping?: RequestFieldMap;
	compilationLevel?: CompilationLevel;
}

export const DisallowedFormats = ["float", "double", "int32", "int64", "byte", "binary"];
export const FUNCTION_PREFIX = "f";
const ajv = new Ajv({
	coerceTypes: true,
	useDefaults: "shared",
	sourceCode: true,
	errorDataPath: "property",
	unicode: false,
});

export async function compile(spec: Spec, options?: ICompilerOptions) {
	
	const output: CompilerOutput = {
		module: null,
		debugArtifacts: {
			hashes: [],
			preSwagger: null,
			derefSwagger: null,
			initialSchema: [],
			processedSchema: [],
			initialCompiles: [],
			mangledSchema: [],
			intermediateFunctions: [],
			intermediateModule: null,
			postCompileModule: null,
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
			formData: "post",
			header: "normalizedHeaders",
			path: "pathParams",
			query: "queryString",
		},
		debug: false,
		compilationLevel: CompilationLevel.ADVANCED,
	};

	merge(defaultCompilerOptions, options);
	options = defaultCompilerOptions;
	await validate(cloneDeep(spec));
	output.debugArtifacts.preSwagger = swaggerPreproccess(spec);
	output.debugArtifacts.derefSwagger = await dereference(spec);
	const apiHashes: string[] = [];
	const apiCache: string[] = [];
	const apiSchemas: ExtendedSchema[] = [];
	for (const path of Object.keys(output.debugArtifacts.derefSwagger.paths)){
		for (const method of Object.keys(output.debugArtifacts.derefSwagger.paths[path])){
			const hash = FUNCTION_PREFIX + metrohash64(`${path}:${method}`);
			const schema = compileMethodSchema((output.debugArtifacts.derefSwagger.paths[path] as any)[method], method, path,
				options.requestFieldMapping);
			const schemaProcessed = schemaPreprocess(schema);
			const initialCompile = ajv.compile(schemaProcessed);
			const mangled = mangleKeys(schemaProcessed);
			const templated = templates.validatorTemplate({
				validate: initialCompile,
				funcName: path,
				localConsumes: (output.debugArtifacts.derefSwagger.paths[path] as any)[method].consumes,
				hash,
				format: (ajv as any)._opts.format,
				mangledKeys: mangled.mangledKeys,
				schema: mangled.schema,
			});
			output.debugArtifacts.hashes.push(hash);
			output.debugArtifacts.initialSchema.push(schema);
			output.debugArtifacts.intermediateFunctions.push(templated);
			output.debugArtifacts.processedSchema.push(schemaProcessed);
			output.debugArtifacts.initialCompiles.push(initialCompile);
			output.debugArtifacts.mangledSchema.push(mangled);
		}
	}

	output.debugArtifacts.intermediateModule = beautifier(templates.moduleTemplate({
		validatorLib: output.debugArtifacts.intermediateFunctions,
		defHash: metrohash64(stringify(spec.definitions)),
		exportHashes: output.debugArtifacts.hashes,
		swagger: spec,
	}));

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
		language_out: "ES5_STRICT",
		debug: options.debug,
		jscomp_off: errorSup,
	};

	await new Promise((resolve, reject) => {
		new ClosureCompiler(compilerFlags).run((exitCode: number, stdout: string, stderr: string) => {
			output.debugArtifacts.closureOutput.stderr = stderr;
			output.debugArtifacts.closureOutput.stdout = stdout;
			output.debugArtifacts.closureOutput.exitCode = exitCode;

			if (!exitCode) {
				output.debugArtifacts.postCompileModule =
					fs.readFileSync(outputTemp.name, {encoding: "utf8"}) as ValidatorModuleContent;
				resolve();
			} else {
				reject(stderr);
			}
		});
	});

	output.module = finalProcess(output.debugArtifacts.postCompileModule);

	return output;
}

function finalProcess(content: ValidatorModuleContent): ValidatorModuleContent {
	"use strict";
	const trueReg = /!0/g;
	const falseReg = /!1/g;
	const nullReg = /void 0/g;
	const arrayCheckReg = /Array.isArray\(([a-zA-Z]*?)\)/g;

	let ret = content.replace(trueReg, " true");
	ret = ret.replace(falseReg, " false");
	ret = ret.replace(nullReg, "undefined");
	// ret = ret.replace(arrayCheckReg,"($1 instanceof Array)");

	return ret;
}
