import {CommandModule} from "yargs";
import {Config} from "../lib/config";

function testValoryApp(input: {path: string}) {
    Config.load(true, input.path, true);
    Config.setDefaultAdaptorPath(require.resolve("../lib/default-adaptor"));
    require(Config.resolveEntryPoint())
}

export const TestCommand: CommandModule = {
    command: "test",
    describe: "Start Valory app using the default adaptor",
    handler() {
        testValoryApp({
            path: process.cwd()
        })
    }
};
