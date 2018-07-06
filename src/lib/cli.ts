#!/usr/bin/env node

import {VALORYLOGGERVAR, ValoryMetadata, VALORYPRETTYLOGGERVAR} from "../main";
import {CompilationLevel} from "../compiler/compilerheaders";
import {Swagger} from "../server/swagger";
import {compileAndSave, COMPILED_SWAGGER_PATH, setCompSwagPath} from "../compiler/loader";
import {isNil, omitBy} from "lodash";
import {extname, join, resolve} from "path";
import {routeBuild} from "../tsoa/tsoaRunner";
import yargs = require("yargs");
import P = require("pino");

async function compilerRunner(args: any) {
	require("ts-node").register();
	process.env.VALORYCOMPILER = "TRUE";
	if (args.prettylog) {
		process.env.PRETTYLOG = "true";
	}
	const Logger = P({
		level: process.env[VALORYLOGGERVAR] || "info",
		prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true",
	});
	args.entrypoint = resolve(args.entrypoint);
	if (extname(args.entrypoint) === ".ts") {
		await routeBuild(args.entrypoint);
	}
	setCompSwagPath(args.entrypoint);
	const valExport: { valory: ValoryMetadata } = require(args.entrypoint);
	const api = valExport.valory.swagger;
	api.schemes = args.schemes;
	api.host = args.host;
	api.info.version = args.apiVersion;
	const output = omitBy(api, isNil) as Swagger.Spec;
	const compLevel = CompilationLevel[args.compilationLevel] as any;
	compileAndSave(output, COMPILED_SWAGGER_PATH, process.cwd(),
		valExport.valory.undocumentedEndpoints, {
			debug: args.debugMode, compilationLevel: compLevel,
			singleError: args.singleError,
			discrimFastFail: args.discrimFastFail,
		}, args.debugArtifactPath)
		.then(() => {
			Logger.info("Compilation Complete");
			process.exit(0);
		});
}

function cliRunner(args: any) {
	require("ts-node").register();
	process.env.TEST_MODE = "TRUE";
	process.env.PORT = args.port;
	if (args.prettylog) {
		process.env.PRETTYLOG = "true";
	}
	process.env[VALORYLOGGERVAR] = args.loglevel;
	args.entrypoint = resolve(args.entrypoint);
	setCompSwagPath(args.entrypoint);
	require(args.entrypoint);
}

yargs
	.command("compile <entrypoint>", "Compile valory project", (inst) => {
		inst
			.positional("entrypoint", {
				description: "Main entrypoint for the api",
			})
			.options({
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
			});

		return inst;
	}, compilerRunner)
	.command("test <entrypoint>", "Start a test server", (inst) => {
		inst.positional("entrypoint", {
			description: "Main entrypoint for the api",
		})
			.options({
				port: {
					alias: "p",
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
			});

		return inst;
	}, cliRunner)
	.demandCommand()
	.parse();
