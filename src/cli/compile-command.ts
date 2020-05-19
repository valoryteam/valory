import {CommandModule} from "yargs";
import {spawnSync} from "child_process";
import {gte, coerce} from "semver";
import chalk = require("chalk");
import {ThreadSpinner} from "thread-spin";
import {OpenAPIV3} from "openapi-types";
import {Spinner, spinnerFail, spinnerWrap} from "../lib/spinner";
import {Config} from "../lib/config";
import {SpecCompiler} from "../compiler/spec-compiler/spec-compiler";
import {saveGlobalData, saveGlobalDataRoutesOnly} from "../lib/global-data";
import {RouteCompiler} from "../compiler/route-compiler/route-compiler";
import {
    COMPSWAG_VERSION, GLOBAL_ENTRY_KEY,
    HttpMethodLowercase,
    HttpMethodsLowercase, METADATA_VERSION,
    ROUTES_VERSION,
    uppercaseHttpMethod
} from "../lib/common/headers";
import {writeFileSync} from "fs";
import {merge} from "lodash";

export interface CompileOptions {
    path: string;
}

async function checkRequirements() {
    const versionRegex = /version \"([A-Za-z0-9\_\.]*?)\"/g;
    console.log(chalk.bold("Requirements"));
    await Spinner.start("Node 12+");
    if (!gte(coerce(process.version), "12.0.0")) {
        await spinnerFail("Node version too low", null, true);
    }
    await Spinner.succeed(chalk.green(`Node ${process.version}`), false);
    if (process.platform !== "darwin" && process.platform !== "linux") {
        await Spinner.start("Java 1.7+");
        try {
            const javaOutput = spawnSync("java", ["-version"]).stderr;
            // console.log(javaOutput);
            // console.log( versionRegex.exec(javaOutput.toString()));
            const javaVersion = versionRegex.exec(javaOutput.toString())[1];
            if (!gte(coerce(javaVersion), coerce("1.7"))) {
                await spinnerFail("Java version too low", null, true);
            }
            await Spinner.succeed(chalk.green(`Java ${javaVersion}`));
        } catch (e) {
            await spinnerFail("Java installation missing or broken", e, true);
        }
    }
    await Spinner.start("valory-runtime");
    const pkg = Config.PackageJSON;
    if (process.env.NODE_ENV === "test" || pkg.dependencies["valory-runtime"]) {
        await Spinner.succeed(chalk.green(`valory-runtime ${pkg.dependencies["valory-runtime"]}`), false);
    } else {
        await spinnerFail("valory-runtime must be a dependency", null, true);
    }
    console.log();
}

function printHeader() {
    console.log(chalk.bold("valory compile"));
    console.log();

    console.log(chalk.bold("Valory"));
    console.log(`Compiler:      v${require("../../package.json").version}`);
    console.log(`Validation:    v${COMPSWAG_VERSION}`);
    console.log(`Routes:        v${ROUTES_VERSION}`);
    console.log(`Metadata:      v${METADATA_VERSION}`);
    console.log();

    console.log(chalk.bold("Project"));
    console.log(`Project:       ${Config.PackageJSON.name}`);
    console.log(`Version:       ${Config.PackageJSON.version}`);
    console.log(`Config:        ${Config.ConfigPath}\n`);

    console.log(chalk.bold("Compiler Options"));
    Object.entries(Config.ConfigData.compilerOptions).forEach(([option, value]) => {
        console.log(`${option}: ${value}`);
    });
    console.log("\n");
}

async function compile(options: CompileOptions) {
    await spinnerWrap(() => {
        Config.load(true, options.path, true);
    }, "Loading Environment");
    printHeader();
    await checkRequirements();
    const routeCompiler = new RouteCompiler({entrypoint: Config.resolveEntryPoint(), outputDirectory: Config.resolveOutputDirectory()}, {allowedHeaders: Config.ConfigData.cors.allowedHeaders});
    const routes = await routeCompiler.compile();
    const spec = merge(routes.spec, Config.ConfigData.spec);
    const specCompiler = new SpecCompiler(spec, Config.ConfigData.compilerOptions);
    const compiledSpec = await specCompiler.compile();
    await spinnerWrap(saveGlobalData({validation: compiledSpec, routes: routes.routeModule}, Config.resolveOutputDirectory()), "Outputting Generated Files");
    if (Config.ConfigData.specOutput != null) {writeFileSync(Config.resolveSpecOutput(), JSON.stringify(spec));}
    ThreadSpinner.shutdown();
    printFooter(spec);
}

function printFooter(spec: OpenAPIV3.Document) {
    console.log("");
    console.log(chalk.bold("Routes"));
    console.log(getRouteList(spec));
}

function getRouteList(spec: OpenAPIV3.Document) {
    return Object.entries(spec.paths).flatMap(([path, item]) =>{
        return Object.keys(item).filter(key => HttpMethodsLowercase.includes(key as any)).map((method: HttpMethodLowercase) => `${path}:${uppercaseHttpMethod(method)}`);
    }).join("\n");
}

export const CompileCommand: CommandModule = {
    command: "compile",
    describe: "Runs the Valory compile",
    async handler(args) {
        compile({
            path: process.cwd()
        });
    }
};
