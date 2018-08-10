import {MetadataGenerator} from "./metadataGeneration/metadataGenerator";
import {SpecGenerator} from "./specGenerator";
import {dirname, extname, join, relative} from "path";
import {writeFileSync} from "fs";
import {Config} from "../lib/config";
import chalk from "chalk";
import {Spinner, spinnerFail} from "../lib/spinner";

const dotJs = require("dot");
dotJs.log = false;
dotJs.templateSettings.strip = false;
const templates = dotJs.process({path: join(__dirname, "../../templates")});

export async function routeBuild(entryPoint: string) {
	console.log(chalk.bold("Controller Generation"));
	await Spinner.start("Generating route controller metadata");
	let metadata;
	try {
		metadata = new MetadataGenerator(entryPoint).Generate();
	} catch (e) {
		await spinnerFail("Metadata Failure", e);
	}
	await Spinner.succeed();
	await Spinner.start("Building swagger content from metadata");
	const swaggerContent = new SpecGenerator(metadata).GetSpec();
	metadata.controllers.forEach((con) => {
		const relativePath = relative(dirname(entryPoint), con.location);
		con.location = "./" + relativePath.replace(extname(relativePath), "");
	});
	await Spinner.succeed();
	try {
		await Spinner.start("Generating routes");
		const generatedRoutes = templates.apiTemplate({
			swagger: swaggerContent,
			metadata,
			valoryRuntime: Config.ValoryRuntime,
		});

		const generatedPath = Config.SourceRoutePath;

		writeFileSync(generatedPath, generatedRoutes.replace(/\"([a-zA-Z_$][0-9a-zA-Z_$]+)\":/g, "$1:"));
		await Spinner.succeed();
	} catch (e) {
		await spinnerFail("Route Generation Failure", e);
	}
}
