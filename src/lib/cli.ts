#!/usr/bin/env node
import {CLI_MODE_FLAG, Config} from "./config";

process.env[CLI_MODE_FLAG] = "true";

import {VALORYLOGGERVAR, ValoryMetadata, VALORYMETAVAR, VALORYPRETTYLOGGERVAR} from "../main";
import {CompilationLevel} from "../compiler/compilerheaders";
import {Swagger} from "../server/swagger";
import {compileAndSave} from "../compiler/compileRunner";
import isNil = require("lodash/isNil");
import omitBy = require("lodash/omitBy");
import {extname, join, resolve} from "path";
import {routeBuild} from "../tsoa/tsoaRunner";
import yargs = require("yargs");
import * as inquirer from "inquirer";
import {existsSync, writeFileSync} from "fs";
import {ThreadSpinner} from "thread-spin";
import {convertTime} from "./helpers";
import chalk from "chalk";
import {Spinner, spinnerFail} from "./spinner";
import {coerce, gt} from "semver";
import {spawnSync} from "child_process";

async function checkRequirements() {
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

async function compilerRunner(args: any) {
	console.log(chalk.bold(`valory compile v${require("../../package.json").version}\n`));
	console.log(`Project:       ${Config.PackageJSON.name}`);
	console.log(`Version:       ${Config.PackageJSON.version}`);
	console.log(`Config:        ${Config.ConfigPath}\n`);

	await checkRequirements();
	const start = process.hrtime();
	require("ts-node").register({
		project: join(__dirname, "../../tsconfig.json"),
		compilerOptions: {
			types: ["node"],
		},
	});
	if (args.prettylog) {
		process.env.PRETTYLOG = "true";
	}
	// const Logger = P({
	// 	level: process.env[VALORYLOGGERVAR] || "info",
	// 	prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true",
	// });
	if (Config.SourceRoutePath !== "") {
		await routeBuild(Config.ConfigData.sourceEntrypoint);
	}
	console.log(chalk.bold("Appserver Warmup"));
	await Spinner.start("Registering routes");
	let valExport: { valory: ValoryMetadata };
	try {
		require((Config.ConfigData.sourceEntrypoint !== ""
			? Config.ConfigData.sourceEntrypoint : Config.ConfigData.entrypoint));
		// Logger.info(process.env[VALORYMETAVAR]);
		valExport = JSON.parse(process.env[VALORYMETAVAR]);
	} catch (e) {
		await spinnerFail("failed to load apperver", e);
	}
	Spinner.succeed();
	const api = valExport.valory.swagger;
	api.schemes = args.schemes;
	api.host = args.host;
	api.info.version = args.apiVersion;
	const output = omitBy(api, isNil) as Swagger.Spec;
	const compLevel = CompilationLevel[args.compilationLevel] as any;
	compileAndSave(output, Config.CompSwagPath, process.cwd(),
		valExport.valory.undocumentedEndpoints, {
			debug: args.debugMode, compilationLevel: compLevel,
			singleError: args.singleError,
			discrimFastFail: args.discrimFastFail,
		}, args.debugArtifactPath)
		.then(() => {
			console.log("\nDone", (convertTime(process.hrtime(start)) / 1000).toFixed(3) + "s");
			ThreadSpinner.shutdown();
			process.exit(0);
		});
}

function cliRunner(args: any) {
	// require("ts-node").register();
	process.env.TEST_MODE = "TRUE";
	process.env.DEFAULT_ADAPTOR = require.resolve("./defaultAdaptor");
	process.env.PORT = args.port;
	if (args.prettylog) {
		process.env.PRETTYLOG = "true";
	}
	process.env[VALORYLOGGERVAR] = args.loglevel;
	require(Config.ConfigData.entrypoint);
}

async function configBuilder(args: object) {
	const config = await inquirer.prompt([
		{
			name: "entrypoint",
			message: `Path to entrypoint file. Relative to ${Config.RootPath}`,
			type: "input",
			validate: (path: string) => {
				const resolved = resolve(join(Config.RootPath, path));
				if (!existsSync(resolved)) {
					return "Entrypoint file does not exist";
				}
				const ext = extname(resolved);
				if (ext !== ".js") {
					return "Entrypoint must be a plain javascript file";
				}

				return true;
			},
		},
		{
			name: "isTS",
			message: "Is this a typescript project?",
			type: "confirm",
		},
		{
			name: "sourceEntrypoint",
			message: `Path to ts source file for the entrypoint. Relative to ${Config.RootPath}`,
			type: "input",
			when: (currentArgs: any) => {
				return currentArgs.isTS;
			},
			validate: (path: string) => {
				const resolved = resolve(join(Config.RootPath, path));
				if (!existsSync(resolved)) {
					return "Entrypoint file does not exist";
				}
				const ext = extname(resolved);
				if (ext !== ".ts") {
					return "Entrypoint must be a typescript file";
				}

				return true;
			},
		},
		{
			name: "singleError",
			message: "Enable single error mode",
			type: "confirm",
			default: false,
		},
	]);

	writeFileSync(Config.ConfigPath, JSON.stringify(config, null, 2));
}

yargs
	.option("project", {
		desc: "Top level of your project containing valory.json",
		type: "string",
		default: process.cwd(),
		alias: "p",
	})
	.command("init", "Initialize valory config", (inst) => {
		inst.config("project", (rootPath) => {
			Config.load(false, rootPath);
			return Config.ConfigData;
		});
		return inst;
	}, configBuilder)
	.command("compile", "Compile valory project", (inst) => {
		inst
			.options({
				entrypoint: {
					description: "Main entrypoint for the api",
				},
				host: {
					description: "The host for your api e.g. somewebsite.com",
					type: "string",
				},
				scheme: {
					alias: "s",
					description: "The access method for your api",
					choices: ["http", "https"],
					default: "https",
					type: "string",
				},
				basePath: {
					alias: "r",
					description: "Api path relative to the host. It must start with a slash.",
					coerce: ((resourcePath: string) => {
						if (resourcePath.startsWith("/")) {
							return resourcePath;
						} else {
							throw Error("Resource path MUST start with a '/'");
						}
					}),
					default: "/",
					type: "string",
				},
				outputFile: {
					alias: "o",
					desc: "File to write swagger output to.",
					default: join(process.cwd(), "swagger.json"),
					type: "string",
				},
				apiVersion: {
					desc: "Api version string",
					default: "1.0.0",
					type: "string",
				},
				singleError: {
					desc: "Only return a single validation error at a time",
					boolean: true,
					default: false,
				},
				discrimFastFail: {
					desc: "Enables discriminator fast fail EXPERIMENTAL",
					boolean: true,
					default: false,
				},
				compilationLevel: {
					alias: "l",
					desc: "Compilation level to pass to closure compiler",
					choices: ["SIMPLE", "ADVANCED", "WHITESPACE_ONLY"],
					default: "ADVANCED",
				},
				debugMode: {
					alias: "d",
					desc: "Enable debug mode for the compiler.",
					boolean: true,
					default: false,
				},
				debugArtifactPath: {
					alias: "a",
					desc: "When specified, intermediate compilation artifacts will be placed in a folder create here",
					type: "string",
				},
				prettylog: {
					desc: "Prettyify log output",
					boolean: true,
					default: false,
				},
			}).config("project", (rootPath: string) => {
			process.env.VALORYCOMPILER = "TRUE";
			Config.load(true, rootPath);
			return Config.ConfigData;
		});

		return inst;
	}, (args) => { compilerRunner(args).then().catch((err) => {
		console.error(err);
	}); })
	.command("test", "Start a test server", (inst) => {
		inst.options({
				entrypoint: {
					description: "Main entrypoint for the api",
				},
				port: {
					desc: "Port to run the appserver on",
					default: 8080,
					type: "number",
				},
				prettylog: {
					desc: "Prettyify log output",
					boolean: true,
					default: false,
				},
				loglevel: {
					alias: "l",
					desc: "logging level",
					type: "string",
					default: "info",
				},
			}).config("project", (rootPath: string) => {
			Config.load(true, rootPath);
			return Config.ConfigData;
		});

		return inst;
	}, cliRunner)
	.demandCommand()
	.parse();
