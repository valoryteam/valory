import {Swagger} from "../server/swagger";
import * as path from "path";
import {writeFileSync, existsSync, mkdirSync} from "fs";
import {cloneDeep, omit} from "lodash";
import {HASH_SEED, ICompilerOptions, ValidatorModule} from "./compilerheaders";
import {VALORYLOGGERVAR, VALORYPRETTYLOGGERVAR} from "../main";
import P = require("pino");
const hyperid = require("hyperid");

export const SWAGGER_FILE = "swagger.json";
export const COMPILED_SWAGGER_FILE = ".compswag.js";
export const GENERATED_ROUTES_FILE = ".generatedRoutes.ts";
export const ROOT_PATH = path.join(module.paths[2], "..");
export let COMPILED_SWAGGER_PATH = "";
setCompSwagPath();
const XXH = require("xxhashjs");

export async function compileAndSave(swagger: Swagger.Spec, compilePath: string, additionalPath: string
									 , undocumentedPaths: string[], compilerOptions: ICompilerOptions, debugPath?: string) {
	const compiled = await require("./compiler").compile(swagger, compilerOptions);
	const Logger = P({level: process.env[VALORYLOGGERVAR] || "info",
		prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true"});
	Logger.info("Saving compiled swagger to: " + compilePath);
	writeFileSync(compilePath, compiled.module);
	const trimmedSpec = cloneDeep(swagger);
	omit(trimmedSpec, undocumentedPaths);
	if (debugPath != null) {
		if (!existsSync(debugPath)) {
			mkdirSync(debugPath);
		}
		const id = Buffer.from(hyperid()()).toString("base64");
		mkdirSync(path.join(debugPath, id));
		Logger.info("Placing additional debug artifacts in:", path.join(debugPath, id));
		for (const name of Object.keys(compiled.debugArtifacts)) {
			const item = compiled.debugArtifacts[name];
			if (typeof item === "string") {
				writeFileSync(path.join(debugPath, id, name + ".js"), item);
			}
		}
	}
	writeFileSync(compilePath.replace(COMPILED_SWAGGER_FILE, SWAGGER_FILE), JSON.stringify(trimmedSpec));
	writeFileSync(path.join(additionalPath, SWAGGER_FILE), JSON.stringify(trimmedSpec));
}

export function loadModule(definitions: {[x: string]: Swagger.Schema}): ValidatorModule {
	const module: ValidatorModule = require(COMPILED_SWAGGER_PATH);
	if (XXH.h32(JSON.stringify(definitions), HASH_SEED).toString() !== module.defHash) {
		throw Error("Compiled swagger is out of date. Please run valory CLI.");
	}
	return module;
}

export function setCompSwagPath(entryPoint?: string) {
	COMPILED_SWAGGER_PATH = resolveCompSwagPath(entryPoint);
	// console.log("CompSwag path set to:", COMPILED_SWAGGER_PATH);
}

function resolveCompSwagPath(entryPoint?: string): string {
	"use strict";
	if (entryPoint) {
		return path.join(path.dirname(require("find-up").sync("package.json", {cwd: entryPoint})), COMPILED_SWAGGER_FILE);
	} else {
		const newPath = __dirname.split("node_modules");
		if (newPath.length > 1) {
			return path.join(newPath.slice(0, newPath.length - 1)[0], COMPILED_SWAGGER_FILE);
		} else {
			return path.join(__dirname, COMPILED_SWAGGER_FILE);
		}
	}
}
