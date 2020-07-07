import * as chalk from "chalk";
import {MetadataGenerator} from "tsoa/dist/metadataGeneration/metadataGenerator";
import {SpecGenerator3} from "tsoa/dist/swagger/specGenerator3";
import {spinnerWrap} from "../../lib/spinner";
import {tmpdir} from "os";
import {RouteModule} from "./route-module";
import {unencodePropNames} from "./unencode-prop-names";
import {oneOfToAnyOf} from "./oneOf-to-anyOf";
import {OpenAPIV3} from "openapi-types";
import {routeCollisionCheck} from "./route-collision-check";
import {unmarkHidden} from "./unmark-hidden";

export class RouteCompiler {
    constructor(
       private input: {entrypoint: string, outputDirectory: string},
       private options: {allowedHeaders: string[]},
    ) {}

    public async compile(): Promise<{ routeModule: string, spec: OpenAPIV3.Document, hiddenPaths: string[] }> {
        console.log(chalk.bold("Controller Generation"));
        const metadata = await spinnerWrap(() => {
            const metadataGenerator = new MetadataGenerator(this.input.entrypoint, {
                skipLibCheck: true,
                noEmit: true,
            });
            return metadataGenerator.Generate();
        }, "Generating Metadata");
        const hiddenPaths = unmarkHidden(metadata);
        const specGenerator = new SpecGenerator3(metadata, {
            entryFile: this.input.entrypoint,
            outputDirectory: tmpdir(),
            noImplicitAdditionalProperties: "silently-remove-extras",
        });
        const spec = await spinnerWrap(() => {
            const unverifiedSpec  = oneOfToAnyOf(unencodePropNames(specGenerator.GetSpec()));
            routeCollisionCheck(unverifiedSpec as any);
            return unverifiedSpec;
        }, "Generating Spec");
        const routeModule = new RouteModule(metadata, spec as any, this.input.outputDirectory, this.options.allowedHeaders);
        const routes = await spinnerWrap(routeModule.generate(), "Generating Routes");
        return {hiddenPaths, routeModule: routes, spec: JSON.parse(JSON.stringify(spec))};
    }
}
