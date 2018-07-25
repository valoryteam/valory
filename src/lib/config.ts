import * as path from "path";
import {readFileSync} from "fs";
import {ThreadSpinner} from "thread-spin";
import {IPackageJSON} from "./package";
import {gt, coerce} from "semver";
import {execSync, spawnSync} from "child_process";
import chalk from "chalk";
import {spinnerFail} from "./helpers";

export const CLI_MODE_FLAG = "VALORY_CLI";
export const VALORY_ROOT = "VALORY_ROOT";

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
	export const GENERATED_ROUTES_FILE = "generatedRoutes.ts";
	export const COMPILED_ROUTES_FILE = "generatedRoutes.js";
	export let RootPath = "";
	export let CompilerMode = false;
	export let Spinner: ThreadSpinner;
	export let Loaded = false;
	export let ConfigPath = "";
	export let SwaggerPath = "";
	export let CompSwagPath = "";
	export let ConfigData: ValoryConfig;
	export let PackageJSON: IPackageJSON = null;
	export let ValoryVersion = "";
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
			Spinner = new ThreadSpinner(undefined, process.env.NODE_ENV === "test");
			ValoryVersion = require(path.join(__dirname, "../../package.json")).version;
			PackageJSON = require(PackageJSONPath);
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

	export async function checkRequirements() {
		const versionRegex = /version \"([A-Za-z0-9\_\.]*?)\"/g;
		console.log(chalk.bold("Requirements"));
		await Spinner.start("Node 8+");
		if (!gt(coerce(process.version), "8.0.0")) {
			await spinnerFail("Node version too low", null);
		}
		await Spinner.succeed(chalk.green(`Node ${process.version}`));
		await Spinner.start("Java 1.7+");
		try {
			const javaOutput = spawnSync("java", ["-version"]).stderr;
			// console.log(javaOutput);
			// console.log( versionRegex.exec(javaOutput.toString()));
			const javaVersion = versionRegex.exec(javaOutput.toString())[1];
			if (!gt(coerce(javaVersion), coerce("1.7"))) {
				await spinnerFail("Java version too low", null);
			}
			await Spinner.succeed(chalk.green(`Java ${javaVersion}`));
		} catch (e) {
			await spinnerFail("Java installation missing or broken", e);
		}
		console.log("");
	}

	function resolveRootPath(): string {
		return __dirname.split("node_modules")[0];
	}
}
