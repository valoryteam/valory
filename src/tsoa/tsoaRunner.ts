import {MetadataGenerator} from "./metadataGeneration/metadataGenerator";
import {VALORYLOGGERVAR, VALORYPRETTYLOGGERVAR} from "../server/valory";
import {SpecGenerator} from "./specGenerator";
import {dirname, extname, join, relative} from "path";
import {writeFileSync} from "fs";
import * as tsfmt from "typescript-formatter";
import P = require("pino");
import {Config} from "../lib/config";

const dotJs = require("dot");
dotJs.log = false;
dotJs.templateSettings.strip = false;
const templates = dotJs.process({path: join(__dirname, "../../templates")});

export async function routeBuild(entryPoint: string) {
	// console.log(routeBuild.caller);
	const Logger = P({
		level: process.env[VALORYLOGGERVAR] || "info",
		prettyPrint: process.env[VALORYPRETTYLOGGERVAR] === "true",
	});
	Logger.info("Generating route controller metadata");
	const metadata = new MetadataGenerator(entryPoint).Generate();
	Logger.info("Building swagger content from metadata");
	const swaggerContent = new SpecGenerator(metadata).GetSpec();
	metadata.controllers.forEach((con) => {
		const relativePath = relative(dirname(entryPoint), con.location);
		con.location = "./" + relativePath.replace(extname(relativePath), "");
	});
	Logger.info("Generating routes");
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

	if (formatted.error) {
		Logger.error("TS-formatter failed:", formatted.message);
	}
	writeFileSync(generatedPath, formatted.dest.replace(/\"([^(\")"]+)\":/g, "$1:"));
}
