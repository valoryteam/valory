import {sha1Buffer, sha1String} from "../lib/helpers";
import {Swagger} from "../server/swagger";
import {HASH_SEED, ValidatorModule} from "./compilerheaders";
import {COMPSWAG_VERION, Config} from "../lib/config";

export function loadModule(definitions: {[x: string]: Swagger.Schema}): ValidatorModule {
	const module: ValidatorModule = require(Config.CompSwagPath);
	if (sha1String(JSON.stringify(definitions)) !== module.defHash) {
		throw Error("Compiled swagger is out of date. Please run valory CLI.");
	}
	if (module.compswagVersion !== COMPSWAG_VERION) {
		throw Error(`Compiled swagger file is version ${module.compswagVersion} but version ${COMPSWAG_VERION} is required`);
	}
	return module;
}
