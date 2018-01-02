import {Spec} from "swagger-schema-official";
import {compile, ICompilerOptions, ValidatorModule} from "../compiler/compiler";
import * as path from "path";
import {writeFileSync} from "fs";
import {cloneDeep, omit} from "lodash";
import {metrohash64} from "metrohash";

const SWAGGER_FILE = "swagger.json";
const COMPILED_SWAGGER_FILE = ".compswag.js";
const COMPILED_SWAGGER_PATH = resolveCompSwagPath();
const stringify = require("fast-json-stable-stringify");

export async function compileAndSave(swagger: Spec, compilePath: string, additionalPath: string
									 , undocumentedPaths: string[], compilerOptions: ICompilerOptions) {
	const compiled = await compile(swagger, compilerOptions);
	writeFileSync(compilePath, compiled.module);
	const trimmedSpec = cloneDeep(swagger);
	omit(trimmedSpec, undocumentedPaths);
	writeFileSync(compilePath.replace(COMPILED_SWAGGER_FILE, SWAGGER_FILE), trimmedSpec);
	writeFileSync(path.join(additionalPath, SWAGGER_FILE), trimmedSpec);
}

export function loadModule(swagger: Spec): ValidatorModule {
	const module: ValidatorModule = require(COMPILED_SWAGGER_FILE);
	if (metrohash64(stringify(swagger.definitions)) !== module.defHash) {
		throw Error("Compiled swagger is out of date. Please run valory CLI.");
	}
	return module;
}

function resolveCompSwagPath(): string {
	"use strict";
	const newPath = __dirname.split("node_modules");
	if (newPath.length > 1) {
		return path.join(newPath.slice(0, newPath.length - 1)[0], COMPILED_SWAGGER_FILE);
	} else {
		return path.join(__dirname, COMPILED_SWAGGER_FILE);
	}
}