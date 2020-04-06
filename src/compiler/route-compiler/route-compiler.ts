import * as chalk from "chalk";
import {MetadataGenerator} from "tsoa/dist/metadataGeneration/metadataGenerator";
import {SpecGenerator3} from "tsoa/dist/swagger/specGenerator3";
import {spinnerWrap} from "../../lib/spinner";
import {tmpdir} from "os";
import {RouteModule} from "./route-module";
import {unencodePropNames} from "./unencode-prop-names";
import {oneOfToAnyOf} from "./oneOf-to-anyOf";

export class RouteCompiler {
    constructor(
       private input: {entrypoint: string, outputDirectory: string}
    ) {}

    public async compile(): Promise<string> {
        console.log(chalk.bold("Controller Generation"));
        const metadata = await spinnerWrap(() => {
            const metadataGenerator = new MetadataGenerator(this.input.entrypoint, {
                skipLibCheck: true,
            });
            return metadataGenerator.Generate();
        }, "Generating Metadata");
        const specGenerator = new SpecGenerator3(metadata, {
            entryFile: this.input.entrypoint,
            outputDirectory: tmpdir(),
            noImplicitAdditionalProperties: "silently-remove-extras",
        });
        const spec = await spinnerWrap(oneOfToAnyOf(unencodePropNames(specGenerator.GetSpec())), "Generating Spec");
        const routeModule = new RouteModule(metadata, spec as any, this.input.outputDirectory);
        const routes = await spinnerWrap(routeModule.generate(), "Generating Routes");
        return routes;
    }
}
