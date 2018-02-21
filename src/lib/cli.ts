#!/usr/bin/env node

import {ValoryConfig, VALORYCONFIGFILE, ValoryMetadata, VALORYPRETTYLOGGERVAR, VALORYLOGGERVAR} from "../server/valory";
import {CompilationLevel} from "../compiler/compilerheaders";
import {Spec} from "swagger-schema-official";
import {compileAndSave} from "../compiler/loader";
import {omitBy, isNil} from "lodash";
import {join} from "path";
import nomnom = require("nomnom");
import {prompt} from "inquirer";
import {existsSync, writeFileSync} from "fs";
import P = require("pino");

async function initConfig(args: any) {
	const configPath = join(process.cwd(), VALORYCONFIGFILE);

	const options = await prompt([
		{
			name: "adaptorModule",
			type: "input",
			message: "Server adaptor module",
			default: "valory-adaptor-fastify",
		},
		{
			name: "apiEntrypoint",
			type: "input",
			message: "API entrypoint file",
		},
	]);
	const configObj: ValoryConfig = {
		adaptorModule: options.adaptorModule,
		apiEntrypoint: options.apiEntrypoint,
		adaptorConfiguration: {},
		workerConfiguration: {},
	};
	writeFileSync(configPath, JSON.stringify(configObj));
}

function compilerRunner(args: any) {
	// let config = {};
	process.env.VALORYCOMPILER = "TRUE";
	const relative = require("require-relative");
	if (args.prettylog) {process.env.PRETTYLOG = "true"; }
	const Logger = P({level: process.env[VALORYLOGGERVAR] || "info",
		prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true"});
	args.entrypoint = (args.entrypoint.startsWith("/") || args.entrypoint.startsWith("."))
		? args.entrypoint : "./" + args.entrypoint;
	const valExport: {valory: ValoryMetadata} = relative(args.entrypoint, process.cwd());
	const api = valExport.valory.swagger;
	api.schemes = args.schemes;
	api.host = args.host;
	api.info.version = args.version;
	const output = omitBy(api, isNil) as Spec;
	const compLevel = CompilationLevel[args.compilationLevel] as any;
	compileAndSave(output, valExport.valory.compiledSwaggerPath, process.cwd(),
		valExport.valory.undocumentedEndpoints, {debug: args.debugMode, compilationLevel: compLevel,
			singleError: args.singleError})
		.then(() => {Logger.info("Compilation Complete"); process.exit(0); });
}

function cliRunner(args: any) {
	process.env.TEST_MODE = "TRUE";
	process.env.PORT = args.port;
	if (args.prettylog) {process.env.PRETTYLOG = "true"; }
	process.env[VALORYLOGGERVAR] = args.loglevel;
	const relative = require("require-relative");
	args.entrypoint = (args.entrypoint.startsWith("/") || args.entrypoint.startsWith("."))
		? args.entrypoint : "./" + args.entrypoint;
	relative(args.entrypoint, process.cwd());
}

nomnom.command("compile").options({
	// config: {
	// 	abbr: "c",
	// 	help: "Where to look for valory.json. Defaults to cwd",
	// 	default: join(process.cwd(), "valory.json"),
	// },
	entrypoint: {
		position: 1,
		help: "Main entrypoint for the api",
		required: true,
	},
	host: {
		position: 2,
		help: "The host for your api e.g. somewebsite.com",
	},
	scheme: {
		abbr: "s",
		help: "The access method for your api. e.g. https",
		default: "https",
	},
	basePath: {
		abbr: "r",
		help: "Api path relative to the host. It must start with a slash. e.g. /store/dev",
		callback: ((resourcePath: string) => {
			return (resourcePath.startsWith("/")) ? true : "Resource path MUST start with a '/'";
		}) as any,
		required: true,
		default: "/",
	},
	outputFile: {
		abbr: "o",
		help: "File to write output to",
		default: join(process.cwd(), "swagger.json"),
	},
	version: {
		abbr: "v",
		help: "Api version string e.g. '1.0.0'",
		default: "1.0.0",
		type: "string",
	},
	singleError: {
		flag: true,
		help: "Only return a single validation error at a time",
		default: false,
	},
	compilationLevel: {
		abbr: "l",
		help: "Compilation level ['SIMPLE', 'ADVANCED', 'WHITESPACE_ONLY']",
		required: true,
		default: "ADVANCED",
		// callback: (level: string) => {
		// 	"use strict";
		// 	return (["SIMPLE", "ADVANCED", "WHITESPACE_ONLY"]
		// 		.indexOf(level) > -1) ? true : "Must be one of [\"SIMPLE\", \"ADVANCED\", \"WHITESPACE_ONLY\"]";
		// },
		choices: ["SIMPLE", "ADVANCED", "WHITESPACE_ONLY"],
	},
	debugMode: {
		abbr: "d",
		help: "Enable debug mode for the compiler",
		default: false,
		flag: true,
	},
	prettylog: {
		default: false,
		flag: true,
		help: "Prettyify log messages",
	},
}).callback(compilerRunner).help("run the valory compiler");

nomnom.command("test").options({
	// config: {
	// 	abbr: "c",
	// 	help: "Where to look for valory.json. Defaults to cwd",
	// 	default: join(process.cwd(), "valory.json"),
	// },
	entrypoint: {
		position: 1,
		help: "Main entrypoint for the api",
		required: true,
	},
	port: {
		abbr: "p",
		help: "Port to run appserver on",
		default: 8080,
	},
	prettylog: {
		default: false,
		flag: true,
		help: "Prettyify log messages",
	},
	loglevel: {
		abbr: "l",
		help: "logging level",
		default: "info",
	},
}).callback(cliRunner).help("Start a test server");

// nomnom.command("init").callback(initConfig);

nomnom.parse();
