import * as path from "path";
import {readFileSync, existsSync} from "fs";
import {IPackageJSON} from "./package";

export const CLI_MODE_FLAG = "VALORY_CLI";
export const VALORY_ROOT = "VALORY_ROOT";
export const COMPSWAG_VERION = 1.1;
export const METADATA_VERSION = 1;
export const GENROUTES_VERSION = 1.1;

export interface ValoryConfig {
	entrypoint: string;
	sourceEntrypoint?: string;
	basePath?: string;
	singleError?: boolean;
}

export namespace Config {
	export const DOC_HTML = `<!DOCTYPE html>
		<meta charset="UTF-8">
		<html>
		<head>
			<title>APP_NAME</title>
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<script src="https://code.jquery.com/jquery-3.2.1.slim.min.js"></script>
			<style>
				body {
					margin: 0;
					padding: 0;
				}
				.powered-by-badge{
					display:none;
				},
				.api-info-header + p{
					display: none !important;
				}
			</style>
		</head>
		<body>
		<style>
			header{
				text-align: right;
				padding-right: 20px;
			}
		</style>
		<redoc></redoc>
		<script src="https://rebilly.github.io/ReDoc/releases/latest/redoc.min.js">
		</script>
		<script>
			$(document).ready(function() {
		
				$(".api-info-header + p").hide();
				$(document).on("click", function(e) {
					if ( window.history && window.history.pushState ) {
						window.history.pushState('', '', window.location.pathname)
					} else {
						window.location.href = window.location.href.replace(/#.*$/, '#');
					}
				});
				var path = window.location.origin + window.location.pathname;
				if (path.endsWith("/")) {
					path = path.substr(0, path.length - 1);
				}
				Redoc.init(path+"/swagger.json",{
				});
		
			});
		</script>
		</body>
		</html>`;
	export let DOC_HTML_PROCESSED: string = null;
	export const CONFIG_FILE = "valory.json";
	export const SWAGGER_FILE = "swagger.json";
	export const COMPILED_SWAGGER_FILE = ".compswag.js";
	export const GENERATED_ROUTES_FILE = "generatedRoutes.ts";
	export const COMPILED_ROUTES_FILE = "generatedRoutes.js";
	export let RootPath = "";
	export let CompilerMode = false;
	export let Loaded = false;
	export let ValoryRuntime = false;
	export let ConfigPath = "";
	export let SwaggerPath = "";
	export let CompSwagPath = "";
	export let ConfigData: ValoryConfig;
	export let PackageJSON: IPackageJSON = null;
	export let GeneratedRoutePath = "";
	export let SourceRoutePath = "";
	export let PackageJSONPath = "";

	export function load(loadConfig: boolean = true, root?: string) {
		if (Loaded) {
			return;
		}
		CompilerMode = process.env.VALORYCOMPILER === "TRUE";
		Loaded = true;
		const rootVar = process.env[VALORY_ROOT];
		root = (rootVar != null) ? rootVar : root || resolveRootPath();
		RootPath = root;
		process.env[VALORY_ROOT] = RootPath;
		ConfigPath = `${RootPath}/${CONFIG_FILE}`;
		SwaggerPath = `${RootPath}/${SWAGGER_FILE}`;
		CompSwagPath = `${RootPath}/${COMPILED_SWAGGER_FILE}`;
		PackageJSONPath = `${RootPath}/package.json`;
		if (CompilerMode) {
			PackageJSON = require(PackageJSONPath);
			if (Object.keys(PackageJSON.dependencies).includes("valory-runtime")) {
				ValoryRuntime = true;
			}
		}
		if (loadConfig) {
			try {
				ConfigData = JSON.parse(readFileSync(ConfigPath, {encoding: "utf8"}));
			} catch (err) {
				// return;
				throw Error("Valory config is missing from: " + ConfigPath);
			}
			ConfigData.entrypoint = path.resolve(path.join(RootPath), ConfigData.entrypoint);
			GeneratedRoutePath = `${path.resolve(path.dirname(ConfigData.entrypoint))}/${COMPILED_ROUTES_FILE}`;
			if (ConfigData.sourceEntrypoint) {
				ConfigData.sourceEntrypoint = path.resolve(path.join(RootPath), ConfigData.sourceEntrypoint);
				SourceRoutePath = `${path.resolve(path.dirname(ConfigData.sourceEntrypoint))}/${GENERATED_ROUTES_FILE}`;
			}
		}
		// console.log(Config);
	}

	export function checkPaths() {
		if (ConfigData.sourceEntrypoint == null) {
            if (!existsSync(ConfigData.entrypoint)) {
                throw Error("Entrypoint file does not exist");
            }
            if (!ConfigData.entrypoint.endsWith(".js")) {
                throw Error("Compiled entrypoint must be a js file");
            }
		} else {
            if (!existsSync(ConfigData.sourceEntrypoint)) {
                throw Error("Source entrypoint file does not exist");
            }
            if (!ConfigData.sourceEntrypoint.endsWith(".ts")) {
                throw Error("Source entrypoint must not be a ts file");
            }
        }
	}

	export function processDocHtml(input: {[x: string]: string}) {
		for (const key in input) {
			DOC_HTML_PROCESSED = DOC_HTML.replace(key, input[key]);
		}
	}

	function resolveRootPath(): string {
		return __dirname.split("node_modules")[0];
	}
}
