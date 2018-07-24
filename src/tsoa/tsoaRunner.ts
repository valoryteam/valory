import {MetadataGenerator} from "./metadataGeneration/metadataGenerator";
import {VALORYLOGGERVAR, VALORYPRETTYLOGGERVAR} from "../server/valory";
import {SpecGenerator} from "./specGenerator";
import {dirname, extname, join, relative} from "path";
import {writeFileSync} from "fs";
import * as tsfmt from "typescript-formatter";
import P = require("pino");
import {Config} from "../lib/config";
import {ThreadSpinner} from "thread-spin";
import chalk from "chalk";
import {spinnerFail} from "../lib/helpers";

const dotJs = require("dot");
dotJs.log = false;
dotJs.templateSettings.strip = false;
const templates = dotJs.process({path: join(__dirname, "../../templates")});

export async function routeBuild(entryPoint: string) {
	// console.log(routeBuild.caller);
	// const Logger = P({
	// 	level: process.env[VALORYLOGGERVAR] || "info",
	// 	prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true",
	// });
	console.log(chalk.bold("Controller Generation"));
	const spinner = Config.Spinner;
	await spinner.start("Generating route controller metadata");
	let metadata;
	try {
		metadata = new MetadataGenerator(entryPoint).Generate();
	} catch (e) {
		await spinnerFail("Metadata Failure", e);
	}
	await spinner.succeed();
	await spinner.start("Building swagger content from metadata");
	const swaggerContent = new SpecGenerator(metadata).GetSpec();
	metadata.controllers.forEach((con) => {
		const relativePath = relative(dirname(entryPoint), con.location);
		con.location = "./" + relativePath.replace(extname(relativePath), "");
	});
	await spinner.succeed();
	try {
		await spinner.start("Generating routes");
		// Logger.info({
		// 	swagger: swaggerContent,
		// 	metadata,
		// });
		const generatedRoutes = templates.apiTemplate({
			swagger: swaggerContent,
			metadata,
		});

		const generatedPath = Config.SourceRoutePath;
		const formatted = await tsfmt.processString(generatedPath, generatedRoutes, {
			editorconfig: true,
			replace: true,
			tsconfig: {
				newLine: "LF",
			},
			tsfmt: true,
			tslint: false,
		} as any);

		writeFileSync(generatedPath, formatted.dest.replace(/\"([^(\")"]+)\":/g, "$1:"));
		await spinner.succeed();
	} catch (e) {
		await spinnerFail("Route Generation Failure", e);
	}
}
