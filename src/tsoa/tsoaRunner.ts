import {MetadataGenerator} from "./metadataGeneration/metadataGenerator";
import {SpecGenerator} from "./specGenerator";
import {dirname, extname, join, relative} from "path";
import {writeFileSync} from "fs";
import {Config, GENROUTES_VERSION} from "../lib/config";
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
	await Spinner.succeed(`Generating route controller metadata`);
	await Spinner.start("Building swagger content from metadata");
	const swaggerContent = new SpecGenerator(metadata).GetSpec();
	metadata.controllers.forEach((con) => {
		const relativePath = relative(dirname(entryPoint), con.location);
		con.location = "./" + relativePath.replace(extname(relativePath), "");
	});
	await Spinner.succeed(`Building swagger content from metadata`);
	try {
		await Spinner.start("Generating routes");
		// const resolved = await dereference(cloneDeep(swaggerContent as any));
		const generatedRoutes = templates.apiTemplate({
			swagger: swaggerContent,
			// swaggerResolved: resolved,
			metadata,
			valoryRuntime: Config.ValoryRuntime,
			genroutesVersion: GENROUTES_VERSION,
		});

		const generatedPath = Config.SourceRoutePath;

		writeFileSync(generatedPath, generatedRoutes);
		await Spinner.succeed(`Generating routes`);
	} catch (e) {
		await spinnerFail("Route Generation Failure", e);
	}
}
