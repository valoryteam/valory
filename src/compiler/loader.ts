import {Swagger} from "../server/swagger";
import {HASH_SEED, ValidatorModule} from "./compilerheaders";
import {COMPSWAG_VERION, Config} from "../lib/config";

const XXH = require("xxhashjs");

export function loadModule(definitions: {[x: string]: Swagger.Schema}): ValidatorModule {
	const module: ValidatorModule = require(Config.CompSwagPath);
	if (XXH.h32(JSON.stringify(definitions), HASH_SEED).toString() !== module.defHash) {
		throw Error("Compiled swagger is out of date. Please run valory CLI.");
	}
	if (module.compswagVersion !== COMPSWAG_VERION) {
		throw Error(`Compiled swagger file is version ${module.compswagVersion} but version ${COMPSWAG_VERION} is required`);
	}
	return module;
}
