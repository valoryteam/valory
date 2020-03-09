import {CommandModule} from "yargs";
import {Spinner, spinnerFail, spinnerWrap} from "../lib/spinner";
import {Config} from "../lib/config";
import chalk = require("chalk");
import {SpecCompiler} from "../compiler/spec-compiler/spec-compiler";
import {ModuleBuilder} from "../compiler/module/module-builder";
import {GLOBAL_ENTRY_KEY, saveGlobalData, saveGlobalDataBlank} from "../lib/global-data";
import {ThreadSpinner} from "thread-spin";

export interface CompileOptions {
    path: string;
}

export async function compile(options: CompileOptions) {
    await spinnerWrap(() => {
        Config.setCompileMode(true);
        Config.load(true, options.path, true);
        saveGlobalDataBlank(Config.resolveOutputDirectory());
    }, "Loading Environment");
    console.log(chalk.bold("Appserver Warmup"));
    const metadata = await spinnerWrap(() => {
        require(Config.resolveEntryPoint());
        return Config.getMetadata();
    }, "Registering Routes");
    const specCompiler = new SpecCompiler(metadata.openapi, {});
    const compiledSpec = await specCompiler.compile();
    await spinnerWrap(saveGlobalData({validation: compiledSpec}, Config.resolveOutputDirectory()), "Outputting Generated Files");
    ThreadSpinner.shutdown();
}

export const CompileCommand: CommandModule = {
    command: "compile",
    describe: "Runs the Valory compile",
    async handler(args) {
        compile({
            path: process.cwd()
        })
    }
};
