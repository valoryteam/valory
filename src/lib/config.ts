import * as path from "path";
import {readFileSync} from "fs";

export const CLI_MODE_FLAG = "VALORY_CLI";

export interface ValoryConfig {
	entrypoint: string;
	sourceEntrypoint?: string;
	basePath?: string;
	singleError?: boolean;
}

export namespace Config {
	export const CONFIG_FILE = "valory.json";
	export const SWAGGER_FILE = "swagger.json";
	export const COMPILED_SWAGGER_FILE = ".compswag.js";
	export const GENERATED_ROUTES_FILE = ".generatedRoutes.ts";
	export const COMPILED_ROUTES_FILE = ".generatedRoutes.js";
	export let Loaded = false;
	export let RootPath = "";
	export let ConfigPath = "";
	export let SwaggerPath = "";
	export let CompSwagPath = "";
	export let ConfigData: ValoryConfig;
	export let GeneratedRoutePath = "";
	export let SourceRoutePath = "";

	export function load(loadConfig: boolean = true, root?: string) {
		if (Loaded) {
			return;
		}
		root = root || resolveRootPath();
		Loaded = true;
		RootPath = root;
		ConfigPath = `${RootPath}/${CONFIG_FILE}`;
		SwaggerPath = `${RootPath}/${SWAGGER_FILE}`;
		CompSwagPath = `${RootPath}/${COMPILED_SWAGGER_FILE}`;
		if (loadConfig) {
			ConfigData = JSON.parse(readFileSync(ConfigPath, {encoding: "utf8"}));
			ConfigData.entrypoint = path.resolve(path.join(RootPath), ConfigData.entrypoint);
			GeneratedRoutePath = `${path.resolve(path.dirname(ConfigData.entrypoint))}/${COMPILED_ROUTES_FILE}`;
			if (ConfigData.sourceEntrypoint) {
				ConfigData.sourceEntrypoint = path.resolve(path.join(RootPath), ConfigData.sourceEntrypoint);
				SourceRoutePath = `${path.resolve(path.dirname(ConfigData.sourceEntrypoint))}/${GENERATED_ROUTES_FILE}`;
			}
		}
	}

	function resolveRootPath(): string {
		return path.join(module.paths[2], "..");
	}
}
