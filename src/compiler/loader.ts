import {Schema, Spec} from "swagger-schema-official";
import * as path from "path";
import {writeFileSync} from "fs";
import {cloneDeep, omit} from "lodash";
import {HASH_SEED, ICompilerOptions, ValidatorModule} from "./compilerheaders";
import {ApiServer, ValoryLog} from "../server/valory";

const SWAGGER_FILE = "swagger.json";
const COMPILED_SWAGGER_FILE = ".compswag.js";
export const ROOT_PATH = path.join(module.paths[2], "..");
export const COMPILED_SWAGGER_PATH = resolveCompSwagPath();
const stringify = require("fast-json-stable-stringify");
const XXH = require("xxhashjs");

export async function compileAndSave(swagger: Spec, compilePath: string, additionalPath: string
									 , undocumentedPaths: string[], compilerOptions: ICompilerOptions) {
	const compiled = await require("./compiler").compile(swagger, compilerOptions);
	ValoryLog.info("Saving compiled swagger to: " + compilePath);
	writeFileSync(compilePath, compiled.module);
	const trimmedSpec = cloneDeep(swagger);
	omit(trimmedSpec, undocumentedPaths);
	writeFileSync(compilePath.replace(COMPILED_SWAGGER_FILE, SWAGGER_FILE), stringify(trimmedSpec));
	writeFileSync(path.join(additionalPath, SWAGGER_FILE), stringify(trimmedSpec));
}

export function loadModule(definitions: {[x: string]: Schema}): ValidatorModule {
	const module: ValidatorModule = require(COMPILED_SWAGGER_PATH);
	if (XXH.h32(stringify(definitions), HASH_SEED).toString() !== module.defHash) {
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