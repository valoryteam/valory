import {CommandModule} from "yargs";
import {Config, ValoryConfig} from "../lib/config";
import {prompt, registerPrompt} from "inquirer";
import {existsSync, writeFileSync} from "fs";
import {join, extname, resolve} from "path";
import {ThreadSpinner} from "thread-spin";

async function promptForConfig(path: string): Promise<ValoryConfig> {
    const userInput = await prompt([
        {
            name: "entrypoint",
            message: `Path to entrypoint file. Relative to ${Config.RootPath}`,
            type: "input",
            validate: (input: string) => {
                const resolved = resolve(join(Config.RootPath, input));
                if (!existsSync(resolved)) {
                    return "Entrypoint file does not exist";
                }
                const ext = extname(resolved);
                if (ext !== ".ts") {
                    return "Entrypoint must be a typescript file";
                }

                return true;
            },
            default: "src/index.ts"
        },
        {
            name: "outputDirectory",
            message: `Path to output generated code to. Must be included in ts compilation. Relative to ${Config.RootPath}`,
            type: "input",
            default: "src/generated",
            validate(input: string) {
                const resolved = resolve(join(Config.RootPath, input));
                if (existsSync(resolved)) {
                    return "outputDirectory must not exist";
                }
                return true;
            }
        },
    ]);

    return {
        ...userInput,
        specOutput: join(Config.RootPath, userInput.outputDirectory, "openapi.json"),
        compilerOptions: {
            allErrors: false,
            coerceTypes: false,
            prepackErrors: true
        }
    };
}

export const InitCommand: CommandModule = {
    command: "init",
    describe: "Create a new Valory config",
    async handler() {
        Config.load(true, process.cwd());
        ThreadSpinner.shutdown();
        const content = JSON.stringify(await promptForConfig(process.cwd()), null, 4);
        writeFileSync(Config.ConfigPath, content);
    }
};
